
"use client";

import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

type Chat = {
    id: string;
    users: string[];
    lastMessage: string;
    lastUpdated: any;
    participants: { [key: string]: { name: string; avatarUrl: string } };
};

export default function MessagesPage() {
    const { user: currentUser } = useAuth();
    const firestore = useFirestore();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !currentUser) return;

        setIsLoading(true);
        const chatsRef = collection(firestore, 'chats');
        const q = query(
            chatsRef, 
            where('users', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedChats = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Chat));
            
            // Sort chats by lastUpdated descending on the client-side
            fetchedChats.sort((a, b) => {
                const dateA = a.lastUpdated?.toDate ? a.lastUpdated.toDate().getTime() : 0;
                const dateB = b.lastUpdated?.toDate ? b.lastUpdated.toDate().getTime() : 0;
                return dateB - dateA;
            });

            setChats(fetchedChats);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching chats: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [firestore, currentUser]);

    if (!currentUser) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold">Please log in</h2>
                <p className="text-muted-foreground">You need to be logged in to view your messages.</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Your Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-4">
                            {Array.from({length: 3}).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-2">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-grow space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            ))}
                        </div>
                    )}
                    {!isLoading && chats.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <h2 className="text-xl font-semibold">No messages yet</h2>
                            <p>Start a conversation by contacting a seller on a product page.</p>
                        </div>
                    )}
                    {!isLoading && chats.length > 0 && (
                         <div className="space-y-2">
                            {chats.map(chat => {
                                const otherUserId = chat.users.find(id => id !== currentUser.uid);
                                if (!otherUserId) return null;

                                const otherParticipant = chat.participants[otherUserId];

                                return (
                                    <Link 
                                        key={chat.id} 
                                        href={`/messages/${otherUserId}`} 
                                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <Avatar className="h-12 w-12 flex-shrink-0">
                                            <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                                            <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold truncate">{otherParticipant.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex-shrink-0">
                                            {chat.lastUpdated?.toDate && formatDistanceToNow(chat.lastUpdated.toDate(), { addSuffix: true })}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
