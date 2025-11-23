"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from './ui/button';
import { useCallback } from 'react';

type ProductFiltersProps = {
  categories: Category[];
};

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const handleFilterChange = (name: string, value: string) => {
    router.push(pathname + '?' + createQueryString(name, value));
  };
  
  const clearFilters = () => {
    router.push(pathname);
  };
  
  const hasActiveFilters = 
    searchParams.has('q') ||
    searchParams.has('category') ||
    searchParams.has('price_min') ||
    searchParams.has('price_max') ||
    searchParams.has('sort');

  return (
    <Accordion type="single" collapsible className="w-full bg-card rounded-lg border px-4">
      <AccordionItem value="filters" className="border-b-0">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="font-semibold">Filters & Sort</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Search by keyword..."
                defaultValue={searchParams.get('q') || ''}
                onChange={(e) => handleFilterChange('q', e.target.value)}
              />
              <Select onValueChange={(value) => handleFilterChange('category', value)} value={searchParams.get('category') || 'all'}>
                <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input
                    type="number"
                    placeholder="Min Price (RM)"
                    defaultValue={searchParams.get('price_min') || ''}
                    onChange={(e) => handleFilterChange('price_min', e.target.value)}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                    type="number"
                    placeholder="Max Price (RM)"
                    defaultValue={searchParams.get('price_max') || ''}
                    onChange={(e) => handleFilterChange('price_max', e.target.value)}
                />
              </div>
              <Select onValueChange={(value) => handleFilterChange('sort', value)} value={searchParams.get('sort') || 'date-desc'}>
                <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest</SelectItem>
                  <SelectItem value="date-asc">Oldest</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
