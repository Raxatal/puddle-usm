"use client";

import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, MessageCircle, ShieldCheck, Trash2, Edit } from 'lucide-react';
import { ProductImagesCarousel } from '@/components/product-images-carousel';
import { ReportProductDialog } from '@/components/report-product-dialog';
import { useCart } from '@/context/cart-context';
import { useAuth, useFirestore } from '@/firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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
import Link from 'next/link';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const firestore = useFirestore();
  const id = params.id as string;
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isSeller = user && product && user.uid === product.seller.id;
  const isAdmin = user?.email === 'admin@usm.my';

  useEffect(() => {
    if (!firestore || !id) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const productRef = doc(firestore, 'products', id);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [firestore, id]);

  const handleContactSeller = () => {
    if (!user) {
        router.push('/login');
        return;
    }
    router.push(`/messages/${product.seller.id}?product=${product.id}`);
  };

  const reportProduct = async (reason: string) => {
    if (!user || !product || !firestore) return;

    try {
      // 1. Create the report
      await addDoc(collection(firestore, 'reports'), {
        productId: product.id,
        productName: product.name,
        reportedBy: { id: user.uid, name: user.displayName || user.email },
        reason: reason,
        date: serverTimestamp(),
      });

      // 2. Notify the seller
      const sellerInboxRef = collection(firestore, 'users', product.seller.id, 'notifications');
      await addDoc(sellerInboxRef, {
        userId: product.seller.id,
        title: "Your product has been reported",
        message: `Your listing, "${product.name}", has been reported by a user. Our admin team will review it shortly.`,
        date: serverTimestamp(),
        read: false,
        actionUrl: `/products/${product.id}`
      });

    } catch (error) {
      console.error("Error reporting product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not submit your report. Please try again.",
      });
    }
  };
  
  const handleDeleteProduct = async () => {
    if (!product || !firestore || !(isSeller || isAdmin)) return;

    try {
        await deleteDoc(doc(firestore, 'products', product.id));

        if (isAdmin && !isSeller) {
            const sellerInboxRef = collection(firestore, 'users', product.seller.id, 'notifications');
            await addDoc(sellerInboxRef, {
                userId: product.seller.id,
                title: "Your product has been removed",
                message: `Your listing, "${product.name}", was removed by an administrator.`,
                date: serverTimestamp(),
                read: false,
            });
        }
        
        toast({
            title: "Product Deleted",
            description: `${product.name} has been removed from the marketplace.`,
        });
        router.push('/products');

    } catch (error) {
        console.error("Error deleting product:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the product.",
        });
    }
  };

  if (isLoading) {
    return (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div>
                <Card className="overflow-hidden">
                    <Skeleton className="w-full aspect-[4/3]" />
                </Card>
                <div className="flex gap-2 justify-center mt-4">
                    <Skeleton className="w-12 h-12 rounded-md" />
                    <Skeleton className="w-12 h-12 rounded-md" />
                </div>
            </div>
            <div className="space-y-6">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-1/3 mt-4" />
                <Separator />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <Separator />
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-24" />
                    </div>
                </Card>
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      <div>
        <ProductImagesCarousel images={product.imageUrls} productName={product.name} />
      </div>

      <div className="space-y-6">
        <div>
          <Badge variant="secondary">{product.category.name}</Badge>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mt-2">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mt-4">RM {product.price.toFixed(2)}</p>
        </div>

        <Separator />

        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
        </div>

        <Separator />
        
        <div className="text-sm text-muted-foreground">
          Listed on: {product.dateAdded ? format(new Date(product.dateAdded), "PPP, p") : 'N/A'}
        </div>

        <div>
            <h2 className="text-lg font-semibold mb-4">Seller Information</h2>
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={product.seller.avatarUrl} alt={product.seller.name} />
                        <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{product.seller.name}</p>
                        {product.seller.isVerified && (
                            <div className="flex items-center text-xs text-green-600">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified Student
                            </div>
                        )}
                    </div>
                </div>
                 {!isSeller && (
                    <Button variant="outline" onClick={handleContactSeller}>
                        <MessageCircle className="mr-2 h-4 w-4"/>
                        Chat
                    </Button>
                )}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="flex-1" onClick={() => addToCart(product)} disabled={isSeller}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isSeller ? "This is your listing" : "Add to Cart"}
          </Button>
        </div>

        <div className="text-center space-y-2">
            {user && !isSeller && !isAdmin && <ReportProductDialog onReport={reportProduct} />}
            {(isSeller || isAdmin) && (
                 <div className="flex justify-center gap-2">
                    {isSeller && (
                        <Button variant="outline" asChild>
                            <Link href={`/products/${product.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Listing
                            </Link>
                        </Button>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />{isAdmin ? 'Delete (Admin)' : 'Delete'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your product listing.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteProduct}>Yes, delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
}
