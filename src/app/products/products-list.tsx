
"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { ProductCard } from '@/components/product-card';
import { ProductFilters } from '@/components/product-filters';
import { categories } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

function ProductsListContent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all products once
  useEffect(() => {
    if (!firestore) return;

    const fetchProducts = async () => {
      setIsLoading(true);
      const productsRef = collection(firestore, 'products');
      const q = query(productsRef, firestoreOrderBy('dateAdded', 'desc'));

      try {
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [firestore]);

  // Apply all filters and sorting on the client-side for responsiveness
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    const searchQuery = searchParams.get('q')?.toLowerCase();
    const category = searchParams.get('category');
    const price_min = searchParams.get('price_min');
    const price_max = searchParams.get('price_max');
    const sort = searchParams.get('sort') || 'date-desc';
    
    // Text search
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery)
      );
    }
    
    // Category filter
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category.id === category);
    }

    // Price filter
    if (price_min) {
        filtered = filtered.filter(p => p.price >= Number(price_min));
    }
    if (price_max) {
        filtered = filtered.filter(p => p.price <= Number(price_max));
    }

    // Sorting
    switch (sort) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'date-asc':
          filtered.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
          break;
        default: // 'date-desc'
          // Already sorted by default query, but we re-sort in case other filters changed the order
          filtered.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
          break;
    }

    return filtered;
  }, [products, searchParams]);

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
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
            ))}
        </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-16 text-muted-foreground col-span-full">
            <h2 className="text-xl font-semibold">No products found</h2>
            <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </>
  );
}

export function ProductsList() {
    return (
        <>
            <ProductFilters categories={categories} />
            <ProductsListContent />
        </>
    );
}

