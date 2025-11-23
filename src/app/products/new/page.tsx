
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories } from '@/lib/data';
import { Upload, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useAuth, useFirestore } from '@/firebase';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { uploadFile } from '@/app/actions/upload-actions';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  category: z.string().nonempty('Please select a category.'),
  image: z.custom<File | null>(null).optional(),
});

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const firestore = useFirestore();
  
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

  async function onSubmit(values: z.infer<typeof productSchema>) {
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to create a listing.",
        });
        router.push('/login');
        return;
    }

    setIsSubmitting(true);

    try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error("User profile not found.");
        }
        
        const sellerData = userDoc.data() as AppUser;

        const selectedCategory = categories.find(c => c.id === values.category);
        if (!selectedCategory) {
            throw new Error("Invalid category selected.");
        }
        
        let imageUrl = 'https://picsum.photos/seed/placeholder/600/400'; // Default placeholder
        if (values.image) {
            const formData = new FormData();
            formData.append('file', values.image);
            const uploadResult = await uploadFile(formData);
            if (uploadResult.success && uploadResult.filePath) {
                imageUrl = uploadResult.filePath;
            } else {
                // If upload fails but an image was selected, inform user but don't block listing creation
                 toast({
                    variant: "destructive",
                    title: "Image upload failed",
                    description: `${uploadResult.message} A default image will be used.`,
                });
            }
        }

        await addDoc(collection(firestore, "products"), {
            name: values.name,
            description: values.description,
            price: values.price,
            category: selectedCategory,
            seller: sellerData,
            imageUrls: [imageUrl],
            dateAdded: new Date().toISOString(),
        });

        toast({
            title: 'Listing Created!',
            description: `${values.name} has been successfully listed for sale.`,
        });
        router.push('/products');

    } catch (error: any) {
        console.error("Failed to create listing:", error);
        toast({
            variant: "destructive",
            title: "Failed to create listing",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      form.setValue('image', file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('image', null);
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Sell Your Item</CardTitle>
          <CardDescription>Fill out the details below to list your product on the marketplace.</CardDescription>
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
                      <Textarea placeholder="Describe your item, its condition, and any other relevant details." {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormLabel>Product Image (Optional)</FormLabel>
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
                {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
