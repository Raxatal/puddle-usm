
"use client";

import type { CartItem, Product, Purchase } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch, runTransaction } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  markAsPaid: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const getCartCollectionRef = useCallback(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'cart');
  }, [user, firestore]);

  useEffect(() => {
    if (!user || !firestore) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const cartColRef = getCartCollectionRef();
    if (!cartColRef) {
      setIsLoading(false);
      return;
    }
    
    const unsubscribe = onSnapshot(cartColRef, async (snapshot) => {
        const items: CartItem[] = [];
        for (const cartDoc of snapshot.docs) {
            const data = cartDoc.data();
            const productRef = doc(firestore, 'products', cartDoc.id);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                items.push({
                    product: { id: productSnap.id, ...productSnap.data() } as Product,
                    quantity: data.quantity,
                    status: data.status || 'Unpaid',
                });
            }
        }
        setCartItems(items);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching cart items:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore, getCartCollectionRef]);


  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Please log in",
        description: "You need to be logged in to add items to your cart.",
      });
      router.push('/login');
      return;
    }
    
    const cartColRef = getCartCollectionRef();
    if (!cartColRef) return;
    
    const cartDocRef = doc(cartColRef, product.id);

    try {
        const docSnap = await getDoc(cartDocRef);
        const currentQuantity = docSnap.exists() ? docSnap.data().quantity : 0;
        const newQuantity = currentQuantity + quantity;
        
        await setDoc(cartDocRef, { 
            quantity: newQuantity,
            status: 'Unpaid',
            productId: product.id,
            dateAdded: new Date().toISOString()
         }, { merge: true });

        toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
        });
    } catch (error: any) {
        console.error("Error adding to cart:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not add item to cart.",
        });
    }
  };

  const removeFromCart = async (productId: string) => {
    const cartColRef = getCartCollectionRef();
    if (!cartColRef) return;

    try {
        await deleteDoc(doc(cartColRef, productId));
        toast({
            title: "Item removed",
            description: "The item has been removed from your cart.",
        });
    } catch(error) {
        console.error("Error removing from cart:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not remove item from cart.",
        });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const cartColRef = getCartCollectionRef();
    if (!cartColRef) return;

    try {
        await setDoc(doc(cartColRef, productId), { quantity: quantity }, { merge: true });
    } catch(error) {
        console.error("Error updating quantity:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update item quantity.",
        });
    }
  };
  
  const markAsPaid = async (productId: string) => {
    if (!user || !firestore) return;

    const cartDocRef = doc(firestore, 'users', user.uid, 'cart', productId);
    const purchaseDocRef = doc(firestore, 'users', user.uid, 'purchases', productId);
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const cartDoc = await transaction.get(cartDocRef);
            if (!cartDoc.exists()) {
                throw new Error("Item not found in cart!");
            }
            
            const cartItem = cartItems.find(item => item.product.id === productId);
            if (!cartItem) {
                throw new Error("Product details not found!");
            }

            const purchaseData: Purchase = {
                id: cartItem.product.id,
                productName: cartItem.product.name,
                productImage: cartItem.product.imageUrls[0],
                price: cartItem.product.price,
                sellerName: cartItem.product.seller.name,
                purchaseDate: new Date(),
                status: 'Successful',
            };

            transaction.set(purchaseDocRef, purchaseData);
            transaction.delete(cartDocRef);
        });

    } catch (error) {
        console.error("Transaction failed: ", error);
        toast({
            variant: "destructive",
            title: "Error during purchase",
            description: "Could not complete the purchase.",
        });
    }
  };

  const clearCart = async () => {
    const cartColRef = getCartCollectionRef();
    if (!cartColRef || !firestore) return;

    try {
        const snapshot = await getDocs(cartColRef);
        const batch = writeBatch(firestore);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    } catch(error) {
         console.error("Error clearing cart:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not clear the cart.",
        });
    }
  };
  
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);


  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, markAsPaid, clearCart, cartCount, cartTotal, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
