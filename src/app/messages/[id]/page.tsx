"use client";

import { useSearchParams, notFound, useParams } from 'next/navigation';
import { ChatBox } from '@/components/chat-box';
import { products } from '@/lib/data';
import { useAuth, useFirestore } from '@/firebase';
import type { User as AuthUser } from 'firebase/auth';
import type { User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';


export default function MessagePage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const firestore = useFirestore();
  const productId = searchParams.get('product');

  const { user: currentUser } = useAuth();
  const otherUserId = params.id as string;
  
  const [otherUser, setOtherUser] = useState<User | null>(null);
  
  const relatedProduct = productId ? products.find(p => p.id === productId) : undefined;

  useEffect(() => {
    if (!firestore || !otherUserId) return;
    const userDocRef = doc(firestore, 'users', otherUserId);
    getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
            setOtherUser(docSnap.data() as User);
        }
    });
  }, [firestore, otherUserId]);
  
  
  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">Please log in</h2>
        <p className="text-muted-foreground">You need to be logged in to view messages.</p>
      </div>
    )
  }
  
  if (!otherUser) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">Loading chat...</h2>
        </div>
    )
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
            relatedProduct={relatedProduct}
        />
    </div>
  );
}
