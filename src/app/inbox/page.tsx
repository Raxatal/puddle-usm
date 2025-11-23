
"use client";

import { useAuth, useFirestore } from '@/firebase';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, deleteField } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Notification } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function InboxPage() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const notificationsRef = collection(firestore, 'users', user.uid, 'notifications');
        const q = query(notificationsRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedNotifications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));
            setNotifications(fetchedNotifications);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching notifications: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [firestore, user]);

    const handleConfirmTransaction = async (notification: Notification) => {
        if (!firestore || !user || !notification.metadata?.buyerId || !notification.metadata?.purchaseId) return;

        const purchaseRef = doc(firestore, 'users', notification.metadata.buyerId, 'purchases', notification.metadata.purchaseId);
        const notificationRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
        
        try {
            const batch = writeBatch(firestore);
            // Update purchase status for buyer
            batch.update(purchaseRef, { status: 'Successful' });
            // Mark notification as read for seller and remove the actionType
            batch.update(notificationRef, { read: true, actionType: deleteField() });
            await batch.commit();

            toast({
                title: "Transaction Confirmed",
                description: "The buyer's purchase has been marked as successful.",
            });
        } catch (error) {
            console.error("Error confirming transaction:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not confirm the transaction.",
            });
        }
    };
    
    const handleDeleteNotification = async (notificationId: string) => {
        if (!firestore || !user) return;
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
        try {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(notifRef);
             toast({
                title: "Notification Deleted",
            });
        } catch (error) {
             console.error("Error deleting notification:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({length: 3}).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-4">
                                <Skeleton className="h-6 w-6 mt-1" />
                                <div className="flex-grow space-y-2">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold">Please log in</h2>
                <p className="text-muted-foreground">You need to be logged in to view your inbox.</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Your Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Bell className="mx-auto h-12 w-12 mb-4" />
                            <h2 className="text-xl font-semibold">No new notifications</h2>
                            <p>Important updates and messages will appear here.</p>
                        </div>
                    ) : (
                         <div className="space-y-2">
                            {notifications.map(notif => (
                                <div 
                                    key={notif.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 rounded-lg border",
                                        notif.read ? 'bg-card' : 'bg-primary/5'
                                    )}
                                >
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold">{notif.title}</p>
                                             <div className="text-xs text-muted-foreground">
                                                {notif.date?.toDate && formatDistanceToNow(notif.date.toDate(), { addSuffix: true })}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{notif.message}</p>
                                        
                                        <div className="flex items-center justify-between">
                                            <div>
                                            {notif.actionType === 'confirm_transaction' && !notif.read && (
                                                <Button size="sm" onClick={() => handleConfirmTransaction(notif)}>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Confirm Transaction
                                                </Button>
                                            )}
                                            {notif.actionUrl && notif.actionType !== 'confirm_transaction' &&(
                                                 <Button size="sm" variant="outline" asChild>
                                                    <Link href={notif.actionUrl}>View Details</Link>
                                                </Button>
                                            )}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNotification(notif.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
