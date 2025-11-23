
"use client";

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { CartItem, Purchase } from '@/lib/types';
import { CreditCard, QrCode, Truck } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useFirestore } from '@/firebase';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

export function PaymentDialog({ item, children }: { item: CartItem, children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'select_method' | 'confirm_payment'>('select_method');
    const [paymentMethod, setPaymentMethod] = useState('ewallet');
    const { toast } = useToast();
    const { user } = useAuth();
    const firestore = useFirestore();
    const qrCodeImage = PlaceHolderImages.find(img => img.id === 'qr-code');

    const handleNextStep = () => {
        setStep('confirm_payment');
    };
    
    const initiatePurchase = async (method: 'ewallet' | 'cod' | 'banking') => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "You must be logged in to make a purchase." });
            return;
        }

        const buyerPurchaseRef = doc(collection(firestore, 'users', user.uid, 'purchases'));
        const cartItemRef = doc(firestore, 'users', user.uid, 'cart', item.product.id);
        const sellerNotificationRef = doc(collection(firestore, 'users', item.product.seller.id, 'notifications'));
        
        try {
            await runTransaction(firestore, async (transaction) => {
                // 1. Create a purchase document for the buyer
                const purchaseData: Omit<Purchase, 'id'> = {
                    productName: item.product.name,
                    productImage: item.product.imageUrls[0],
                    price: item.product.price,
                    sellerId: item.product.seller.id,
                    sellerName: item.product.seller.name,
                    buyerName: user.displayName || user.email || 'Anonymous Buyer',
                    purchaseDate: serverTimestamp(),
                    status: 'Pending',
                };
                transaction.set(buyerPurchaseRef, purchaseData);
                
                // 2. Remove item from buyer's cart
                transaction.delete(cartItemRef);

                // 3. Create a notification for the seller
                const notificationTitle = method === 'cod' ? "Cash on Delivery Request" : "Payment Received - Action Required";
                const notificationMessage = `A buyer has initiated a purchase for your item: "${item.product.name}". Please confirm the transaction to proceed.`;
                
                transaction.set(sellerNotificationRef, {
                    userId: item.product.seller.id,
                    title: notificationTitle,
                    message: notificationMessage,
                    date: serverTimestamp(),
                    read: false,
                    actionUrl: `/inbox`,
                    actionType: 'confirm_transaction',
                    metadata: {
                        buyerId: user.uid,
                        productId: item.product.id,
                        purchaseId: buyerPurchaseRef.id
                    }
                });
            });

            toast({
                title: "Purchase Initiated",
                description: "The seller has been notified. Check your profile for purchase status.",
            });
            setOpen(false);
            
        } catch (error) {
            console.error("Transaction failed: ", error);
            toast({
                variant: "destructive",
                title: "Error during purchase",
                description: "Could not complete the purchase. Please try again.",
            });
        } finally {
            setStep('select_method'); // Reset for next time
        }
    };
    
    const resetAndClose = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        setTimeout(() => setStep('select_method'), 150);
      }
    }
    
    const CodConfirmationDialog = ({onConfirm}: {onConfirm: () => void}) => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button>Confirm Payment</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Physical Transaction</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please ensure the physical exchange of cash and the item has been completed before confirming. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
           {step === 'select_method' ? (
              <DialogDescription>
                Choose a payment method for <strong>{item.product.name}</strong>.
              </DialogDescription>
            ) : (
                 <DialogDescription>
                    {paymentMethod === 'ewallet' && "Scan the QR code to pay the seller, then confirm."}
                    {paymentMethod === 'cod' && "Confirm that you have completed the physical transaction."}
                    {paymentMethod === 'banking' && "You will be redirected to your bank's website."}
                 </DialogDescription>
            )}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">Seller: {item.product.seller.name}</p>
                </div>
                <p className="font-bold text-lg text-primary">RM {item.product.price.toFixed(2)}</p>
            </div>

            {step === 'select_method' ? (
                <RadioGroup defaultValue="ewallet" onValueChange={setPaymentMethod}>
                    <Label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                        <RadioGroupItem value="ewallet" id="ewallet" className="mr-4"/>
                        <div className="flex items-center gap-2">
                            <QrCode />
                            <span>E-Wallet (QR)</span>
                        </div>
                    </Label>
                    <Label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                        <RadioGroupItem value="banking" id="banking" className="mr-4"/>
                        <div className="flex items-center gap-2">
                            <CreditCard />
                            <span>Online Banking FPX</span>
                        </div>
                    </Label>
                    <Label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                        <RadioGroupItem value="cod" id="cod" className="mr-4"/>
                        <div className="flex items-center gap-2">
                            <Truck />
                            <span>Cash on Delivery (COD)</span>
                        </div>
                    </Label>
                </RadioGroup>
            ) : (
                 <div className="text-center p-4 bg-muted/50 rounded-lg">
                    {paymentMethod === 'ewallet' && (
                        <>
                            <p className="mb-4">Scan the seller's QR code to pay <strong>RM {item.product.price.toFixed(2)}</strong>, then click "Confirm Payment".</p>
                            <Image 
                                src={item.product.seller.qrCodeUrl || qrCodeImage?.imageUrl || ''} 
                                alt="Seller QR Code" 
                                width={200} 
                                height={200} 
                                className="mx-auto rounded-md border" 
                            />
                        </>
                    )}
                    {paymentMethod === 'cod' && (
                         <p className="mb-4">After the physical transaction has been completed, click the "Confirm Payment" button below.</p>
                    )}
                    {paymentMethod === 'banking' && (
                         <p className="mb-4">You will be redirected to your bank's website to complete the payment. Click below to proceed.</p>
                    )}
                </div>
            )}
        </div>

        <DialogFooter>
          {step === 'select_method' ? (
            <Button type="button" onClick={handleNextStep}>
                Choose Method
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('select_method')}>Back</Button>
               {paymentMethod === 'ewallet' && <Button type="button" onClick={() => initiatePurchase('ewallet')}>Confirm Payment</Button>}
               {paymentMethod === 'cod' && <CodConfirmationDialog onConfirm={() => initiatePurchase('cod')} />}
               {paymentMethod === 'banking' && <Button type="button" onClick={() => initiatePurchase('banking')}>Pay with FPX</Button>}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
