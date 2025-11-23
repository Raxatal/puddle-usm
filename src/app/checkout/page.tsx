"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, QrCode, ShoppingBag } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [paymentMethod, setPaymentMethod] = useState('ewallet');
  const qrCodeImage = PlaceHolderImages.find(img => img.id === 'qr-code');

  if (cartItems.length === 0 && step !== 'confirmation') {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Add items to your cart before proceeding to checkout.</p>
        <Button asChild className="mt-6">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  const handlePayment = () => {
    // Mock payment processing
    setTimeout(() => {
        clearCart();
        setStep('confirmation');
    }, 1000);
  }
  
  const total = cartTotal + 1.00; // includes platform fee

  return (
    <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
            {step === 'shipping' && (
                <>
                    <CardHeader>
                        <CardTitle>Shipping & Collection</CardTitle>
                        <CardDescription>Enter your details for collection point meet-up.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" placeholder="Ali bin Abu" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" placeholder="012-3456789" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hostel">Hostel / Location on Campus</Label>
                            <Input id="hostel" placeholder="Desasiswa Saujana, Blok A" />
                        </div>
                        <Button size="lg" className="w-full" onClick={() => setStep('payment')}>Continue to Payment</Button>
                    </CardContent>
                </>
            )}

            {step === 'payment' && (
                <>
                    <CardHeader>
                        <CardTitle>Payment</CardTitle>
                        <CardDescription>Select your payment method. Total: <strong>RM {total.toFixed(2)}</strong></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RadioGroup defaultValue="ewallet" onValueChange={setPaymentMethod}>
                            <Label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <RadioGroupItem value="ewallet" id="ewallet" className="mr-4"/>
                                <div className="flex items-center gap-2">
                                    <QrCode />
                                    <span>E-Wallet (TNG, GrabPay, etc.)</span>
                                </div>
                            </Label>
                            <Label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <RadioGroupItem value="banking" id="banking" className="mr-4"/>
                                <div className="flex items-center gap-2">
                                    <CreditCard />
                                    <span>Online Banking FPX</span>
                                </div>
                            </Label>
                        </RadioGroup>
                        
                        <Separator />

                        {paymentMethod === 'ewallet' && qrCodeImage && (
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <p className="mb-4">Scan the QR code with your e-wallet app to pay <strong>RM {total.toFixed(2)}</strong>.</p>
                                <Image src={qrCodeImage.imageUrl} alt="QR Code" width={200} height={200} className="mx-auto rounded-md border" />
                            </div>
                        )}
                        {paymentMethod === 'banking' && (
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <p className="mb-4">You will be redirected to your bank's website to complete the payment.</p>
                                <Button size="lg" className="w-full" onClick={handlePayment}>Pay with FPX</Button>
                            </div>
                        )}
                        {paymentMethod === 'ewallet' && <Button size="lg" className="w-full" onClick={handlePayment}>I have paid</Button>}
                        <Button variant="outline" className="w-full" onClick={() => setStep('shipping')}>Back to Shipping</Button>
                    </CardContent>
                </>
            )}

            {step === 'confirmation' && (
                <CardContent className="flex flex-col items-center justify-center text-center p-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold">Payment Successful!</h2>
                    <p className="text-muted-foreground mt-2 mb-6">Your order has been placed. You can view your purchase history in your profile.</p>
                    <Button asChild><Link href="/profile">Go to My Profile</Link></Button>
                </CardContent>
            )}
        </Card>
    </div>
  );
}
