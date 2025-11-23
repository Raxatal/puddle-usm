"use client";

import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

type ProductImagesCarouselProps = {
  images: string[];
  productName: string;
};

export function ProductImagesCarousel({ images, productName }: ProductImagesCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  return (
    <div>
        <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
            {images.map((src, index) => (
                <CarouselItem key={index}>
                <Card className="overflow-hidden">
                    <CardContent className="p-0 flex items-center justify-center aspect-w-4 aspect-h-3">
                    <Image
                        src={src}
                        alt={`${productName} image ${index + 1}`}
                        width={800}
                        height={600}
                        className="object-cover w-full h-full"
                        data-ai-hint="product image"
                    />
                    </CardContent>
                </Card>
                </CarouselItem>
            ))}
            </CarouselContent>
            {images.length > 1 && (
                <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </>
            )}
        </Carousel>
        {images.length > 1 && (
            <div className="flex gap-2 justify-center mt-4">
            {images.map((_, i) => (
                <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                    "w-12 h-12 rounded-md overflow-hidden border-2 transition-all",
                    i === current ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                )}
                >
                <Image
                    src={images[i]}
                    alt={`Thumbnail ${i+1}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                />
                </button>
            ))}
            </div>
        )}
    </div>
  );
}
