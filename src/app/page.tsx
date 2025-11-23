"use client";

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function Home() {
  const firestore = useFirestore();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchRecentProducts = async () => {
      setIsLoading(true);
      try {
        const productsRef = collection(firestore, 'products');
        const q = query(productsRef, orderBy('dateAdded', 'desc'), limit(3));
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setRecentProducts(products);
      } catch (error) {
        console.error("Error fetching recent products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentProducts();
  }, [firestore]);
  
  return (
    <div className="space-y-12">
      <div className="p-8 rounded-lg bg-card border shadow-sm text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">USM Secondhand Marketplace</h1>
        <p className="mt-2 text-lg text-muted-foreground">Buy, sell, and discover exclusive items within the USM community.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/products">
              Browse Items <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/products/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Sell an Item
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Listings</h2>
          <Button variant="ghost" asChild>
            <Link href="/products">View All &rarr;</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="w-full aspect-[4/3] rounded-t-lg rounded-b-none" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-7 w-1/2" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                   <div className="flex items-center gap-2 w-full">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                   </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            recentProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
        {!isLoading && recentProducts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground col-span-full">
            <h2 className="text-xl font-semibold">No listings yet</h2>
            <p>Be the first to sell something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
