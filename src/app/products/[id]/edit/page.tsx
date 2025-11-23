"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories } from '@/lib/data';
import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { uploadFile } from '@/app/actions/upload-actions';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  category: z.string().nonempty('Please select a category.'),
  image: z.custom<File | null>(null).optional(),
});

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const firestore = useFirestore();
  const productId = params.id as string;

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      image: null,
    },
  });

  useEffect(() => {
    if (!firestore || !productId || !user) {
        setIsLoading(false);
        return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      const productRef = doc(firestore, 'products', productId);
      const docSnap = await getDoc(productRef);

      if (docSnap.exists()) {
        const productData = docSnap.data() as Product;
        if (productData.seller.id !== user.uid) {
          toast({ variant: 'destructive', title: 'Unauthorized', description: 'You are not authorized to edit this product.' });
          router.push(`/products/${productId}`);
          return;
        }

        form.reset({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            category: productData.category.id,
        });

        if (productData.imageUrls && productData.imageUrls.length > 0) {
          setImagePreview(productData.imageUrls[0]);
        }
      } else {
        toast({ variant: 'destructive', title: 'Not Found', description: 'This product does not exist.' });
        router.push('/products');
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [firestore, productId, user, router, toast, form]);

  async function onSubmit(values: z.infer<typeof productSchema>) {
    if (!user || !firestore || !productId) return;

    setIsSubmitting(true);

    try {
      let finalImageUrl = imagePreview; // Keep existing image if no new one is uploaded
      
      if (values.image) {
        const formData = new FormData();
        formData.append('file', values.image);
        const uploadResult = await uploadFile(formData);

        if (uploadResult.success && uploadResult.filePath) {
            finalImageUrl = uploadResult.filePath;
        } else {
            throw new Error(uploadResult.message);
        }
      }
      
      const selectedCategory = categories.find(c => c.id === values.category);
      if (!selectedCategory) {
        throw new Error("Invalid category selected.");
      }

      const productRef = doc(firestore, 'products', productId);
      await updateDoc(productRef, {
        name: values.name,
        description: values.description,
        price: values.price,
        category: selectedCategory,
        imageUrls: finalImageUrl ? [finalImageUrl] : ['https://picsum.photos/seed/placeholder/600/400'], // Fallback
      });

      toast({
        title: 'Listing Updated!',
        description: `${values.name} has been successfully updated.`,
      });
      router.push(`/products/${productId}`);

    } catch (error: any) {
      console.error("Failed to update listing:", error);
      toast({
        variant: "destructive",
        title: "Failed to update listing",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newImageURL = URL.createObjectURL(file);
      setImagePreview(newImageURL);
      form.setValue('image', file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('image', null);
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };
  
  if (isLoading) {
    return (
         <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-2 gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Your Listing</CardTitle>
          <CardDescription>Update the details for your product.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Used Textbook" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your item, its condition, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Price (RM)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <FormField
                control={form.control}
                name="image"
                render={() => (
                    <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        <FormControl>
                             <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG or JPEG</p>
                                    </div>
                                    <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
                                </label>
                            </div> 
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
              />

              {imagePreview && (
                <div className="relative w-48 h-48 mx-auto">
                    <Image src={imagePreview} alt="Product preview" layout="fill" className="object-cover rounded-md" />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-75 hover:opacity-100 transition-opacity"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
