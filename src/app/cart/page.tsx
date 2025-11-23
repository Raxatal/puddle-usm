"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import type { CartItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentDialog } from '@/components/payment-dialog';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartCount, isLoading } = useCart();

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (cartCount === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="">
        <h1 className="text-3xl font-bold mb-6">Your Cart ({cartCount})</h1>
        <div className="space-y-4">
          {cartItems.map(item => (
            <CartItemCard key={item.product.id} item={item} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: { item: CartItem, onUpdateQuantity: (id: string, q: number) => void, onRemove: (id: string) => void }) {
    return (
        <Card className="flex items-center p-4">
            <Image 
                src={item.product.imageUrls[0]}
                alt={item.product.name}
                width={100}
                height={100}
                className="rounded-md object-cover"
            />
            <div className="ml-4 flex-grow">
                <Link href={`/products/${item.product.id}`} className="font-semibold hover:underline">{item.product.name}</Link>
                <p className="text-sm text-muted-foreground">Seller: {item.product.seller.name}</p>
                <p className="text-lg font-bold text-primary mt-1">RM {item.product.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-4">
                <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value, 10))}
                    className="w-20 h-9"
                />
                 <PaymentDialog item={item}>
                    <Button>
                        <CreditCard className="mr-2 h-4 w-4" /> Pay
                    </Button>
                 </PaymentDialog>
                <Button variant="ghost" size="icon" onClick={() => onRemove(item.product.id)}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
            </div>
        </Card>
    )
}

function CartSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-9 w-48 mb-6" />
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="flex items-center p-4">
            <Skeleton className="h-[100px] w-[100px] rounded-md" />
            <div className="ml-4 flex-grow space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-1/3" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
