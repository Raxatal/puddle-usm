
"use client";

import { useState, useEffect, useRef } from 'react';
import type { User, Product, Message } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ImagePlus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

type ChatBoxProps = {
  currentUser: User;
  otherUser: User;
  relatedProduct?: Product;
};

export function ChatBox({ currentUser, otherUser, relatedProduct }: ChatBoxProps) {
  const { firebaseApp } = useAuth();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const chatId = [currentUser.id, otherUser.id].sort().join('_');

  useEffect(() => {
    if (!firestore) return;

    const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesColRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Message));
      setMessages(msgs);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load chat messages."
      });
    });

    return () => unsubscribe();
  }, [firestore, chatId, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === '' && !imageFile) || !firestore || !firebaseApp) return;

    setIsSending(true);

    try {
        let imageUrl: string | undefined = undefined;

        if (imageFile) {
          const storage = getStorage(firebaseApp);
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
          const filename = `${uniqueSuffix}-${imageFile.name.replace(/\s/g, '_')}`;
          const storageRef = ref(storage, `image_uploads/${filename}`);
          
          const snapshot = await uploadBytes(storageRef, imageFile);
          imageUrl = await getDownloadURL(snapshot.ref);
        }
        
        const messageText = newMessage.trim();
        const lastMessage = imageUrl ? (messageText ? `${messageText} (Image)` : 'Image') : messageText;

        const messageData: {
            text?: string;
            imageUrl?: string;
            senderId: string;
            timestamp: any;
        } = {
            senderId: currentUser.id,
            timestamp: serverTimestamp(),
        };

        if (messageText) {
            messageData.text = messageText;
        }
        if (imageUrl) {
            messageData.imageUrl = imageUrl;
        }
        
        const chatDocRef = doc(firestore, 'chats', chatId);
        // Ensure the chat document exists with participant info
        await setDoc(chatDocRef, {
            users: [currentUser.id, otherUser.id],
            lastMessage: lastMessage,
            lastUpdated: serverTimestamp(),
            participants: {
                [currentUser.id]: { name: currentUser.name, avatarUrl: currentUser.avatarUrl },
                [otherUser.id]: { name: otherUser.name, avatarUrl: otherUser.avatarUrl },
            }
        }, { merge: true });

        const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
        await addDoc(messagesColRef, messageData);

        setNewMessage('');
        removeImage();

    } catch(error: any) {
        console.error("Error sending message:", error);
        toast({
            variant: "destructive",
            title: "Error Sending Message",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <Card className="w-full h-[70vh] flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4 border-b">
        <Avatar>
          <AvatarImage src={otherUser.avatarUrl} />
          <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="font-semibold">{otherUser.name}</p>
        </div>
      </CardHeader>
      
      {relatedProduct && (
        <div className="p-3 border-b">
          <Link href={`/products/${relatedProduct.id}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
            <Image src={relatedProduct.imageUrls[0]} alt={relatedProduct.name} width={40} height={40} className="rounded-md" />
            <div>
              <p className="font-medium text-sm truncate">{relatedProduct.name}</p>
              <p className="font-bold text-sm text-primary">RM {relatedProduct.price.toFixed(2)}</p>
            </div>
          </Link>
        </div>
      )}

      <CardContent className="flex-grow p-6 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'flex items-end gap-2 max-w-[75%]',
              msg.senderId === currentUser.id ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={msg.senderId === currentUser.id ? currentUser.avatarUrl : otherUser.avatarUrl} />
              <AvatarFallback>{msg.senderId === currentUser.id ? currentUser.name.charAt(0) : otherUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'rounded-lg px-3 py-2 text-sm',
                msg.senderId === currentUser.id
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted rounded-bl-none'
              )}
            >
              {msg.imageUrl && (
                <Image
                    src={msg.imageUrl}
                    alt="Chat image"
                    width={200}
                    height={200}
                    className="rounded-md mb-2 max-w-full h-auto cursor-pointer"
                    onClick={() => window.open(msg.imageUrl, '_blank')}
                />
              )}
              {msg.text && <p>{msg.text}</p>}
              <p className={cn("text-xs mt-1", msg.senderId === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
          </div>
        ))}
         <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="p-4 border-t flex flex-col items-start gap-2">
        {imagePreview && (
          <div className="relative w-24 h-24">
            <Image src={imagePreview} alt="Image preview" fill className="object-cover rounded-md" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-5 w-5"
              onClick={removeImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
            <Input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                <ImagePlus className="h-5 w-5" />
            </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            disabled={isSending}
          />
          <Button type="submit" size="icon" disabled={isSending || (!newMessage.trim() && !imageFile)}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
