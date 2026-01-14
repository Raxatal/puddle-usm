
"use client";

import { useSearchParams, notFound, useParams } from 'next/navigation';
import { ChatBox } from '@/components/chat-box';
import { useAuth, useFirestore } from '@/firebase';
import type { User, Product } from '@/lib/types';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


export default function MessagePage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const firestore = useFirestore();
  
  const { user: currentUser } = useAuth();
  const otherUserId = params.id as string;
  
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [relatedProduct, setRelatedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!firestore || !otherUserId) return;

    setIsLoading(true);
    const userDocRef = doc(firestore, 'users', otherUserId);
    const productId = searchParams.get('product');

    const fetchInitialData = async () => {
        try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setOtherUser(userDocSnap.data() as User);
            } else {
                setOtherUser(null); // User not found
            }

            if (productId) {
                const productDocRef = doc(firestore, 'products', productId);
                const productDocSnap = await getDoc(productDocRef);
                if (productDocSnap.exists()) {
                    setRelatedProduct({ id: productDocSnap.id, ...productDocSnap.data() } as Product);
                }
            }
        } catch (err) {
            console.error("Failed to fetch initial chat data:", err);
            setOtherUser(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchInitialData();
  }, [firestore, otherUserId, searchParams]);
  
  
  if (isLoading) {
    return (
        <div className="max-w-4xl mx-auto">
            <Skeleton className="h-9 w-48 mb-4" />
            <Skeleton className="h-[70vh] w-full" />
        </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">Please log in</h2>
        <p className="text-muted-foreground">You need to be logged in to view messages.</p>
      </div>
    )
  }
  
  if (!otherUser) {
    notFound();
  }

  // Create a User object from the firebase auth user
  const loggedInUser: User = {
    id: currentUser.uid,
    name: currentUser.displayName || currentUser.email || "Current User",
    avatarUrl: currentUser.photoURL || `https://picsum.photos/seed/${currentUser.uid}/100/100`,
    isVerified: currentUser.emailVerified,
  };

  return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Chat with {otherUser.name}</h1>
        <ChatBox
            currentUser={loggedInUser}
            otherUser={otherUser}
            relatedProduct={relatedProduct || undefined}
        />
    </div>
  );
}
