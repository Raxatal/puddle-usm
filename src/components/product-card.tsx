import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all hover:shadow-md hover:-translate-y-1">
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[4/3]">
            <Image
              src={product.imageUrls[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              data-ai-hint="product image"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <Badge variant="secondary" className="mb-2">{product.category.name}</Badge>
            <h3 className="font-semibold text-lg leading-tight truncate">{product.name}</h3>
            <p className="text-primary font-bold text-xl mt-2">RM {product.price.toFixed(2)}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={product.seller.avatarUrl} alt={product.seller.name} />
                    <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{product.seller.name}</span>
            </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
