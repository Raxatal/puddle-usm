
import { Suspense } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductsList } from './products-list';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductFilters } from '@/components/product-filters';
import { categories } from '@/lib/data';

function ProductsPageSkeleton() {
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

export default function ProductsPage() {
  return (
    <div className="space-y-8">
      <div className="p-8 rounded-lg bg-card border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">Browse Products</h1>
          <p className="mt-2 text-lg text-muted-foreground">Find what you need from fellow students.</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/products/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Sell an Item
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ProductsPageSkeleton />}>
        <ProductsList />
      </Suspense>
    </div>
  );
}
