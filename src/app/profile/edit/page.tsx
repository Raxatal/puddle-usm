
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
import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile } from '@/app/actions/upload-actions';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  oldPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
  avatar: z.custom<File | null>(null).optional(),
  qrCode: z.custom<File | null>(null).optional(),
}).refine(data => {
    if (data.newPassword || data.oldPassword || data.confirmPassword) {
      if (!data.newPassword || data.newPassword.length < 8) {
        return false;
      }
    }
    return true;
  }, {
    message: "New password must be at least 8 characters.",
    path: ["newPassword"],
  })
  .refine(data => {
    if (data.newPassword || data.oldPassword || data.confirmPassword) {
      if (data.newPassword !== data.confirmPassword) {
        return false;
      }
    }
    return true;
  }, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  }).refine(data => {
      if (data.newPassword && !data.oldPassword) {
          return false;
      }
      return true;
  }, {
      message: "Please enter your current password to set a new one.",
      path: ["oldPassword"],
  });


export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const firestore = useFirestore();
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      avatar: null,
      qrCode: null,
    },
  });

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, "users", user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          form.setValue('name', userData.name);
          if (userData.avatarUrl) {
            setAvatarPreview(userData.avatarUrl);
          }
          if (userData.qrCodeUrl) {
            setQrPreview(userData.qrCodeUrl);
          }
        }
      });
    }
  }, [user, firestore, form]);
  
  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const uploadResult = await uploadFile(formData);
    if (!uploadResult.success) {
      throw new Error(uploadResult.message);
    }
    return uploadResult.filePath;
  }

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to edit your profile.",
      });
      router.push('/login');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const userDocRef = doc(firestore, "users", user.uid);
      const updateData: { name: string; qrCodeUrl?: string; avatarUrl?: string } = {
        name: values.name,
      };

      // Prepare auth profile updates
      const authUpdateData: { displayName?: string, photoURL?: string } = {
        displayName: values.name,
      };

      if (values.avatar) {
        const avatarPath = await handleFileUpload(values.avatar);
        updateData.avatarUrl = avatarPath;
        // Firebase Auth photoURL should be an absolute URL
        authUpdateData.photoURL = `${window.location.origin}${avatarPath}`;
      }
      
      if (values.qrCode) {
        const qrPath = await handleFileUpload(values.qrCode);
        updateData.qrCodeUrl = qrPath;
      }
      
      // Update Firestore and Auth profile in parallel
      await Promise.all([
        updateDoc(userDocRef, updateData),
        updateProfile(user, authUpdateData)
      ]);


      if (values.newPassword && values.oldPassword && user.email) {
          const credential = EmailAuthProvider.credential(user.email, values.oldPassword);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, values.newPassword);
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      router.push('/profile');
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error.message || "An unexpected error occurred. You may need to log in again to update your password.",
      });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const handleQrFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setQrPreview(imageUrl);
      form.setValue('qrCode', file);
    }
  };

  const removeQrImage = () => {
    setQrPreview(null);
    form.setValue('qrCode', null);
  };
  
  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatarPreview(imageUrl);
      form.setValue('avatar', file);
    }
  };

  const removeAvatarImage = () => {
    setAvatarPreview(null);
    form.setValue('avatar', null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
          <CardDescription>Update your account details below. Leave password fields blank to keep your current password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="avatar"
                render={() => (
                    <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={avatarPreview || undefined} alt="Avatar Preview" />
                                <AvatarFallback>{form.getValues('name')?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <label htmlFor="avatar-upload" className="cursor-pointer text-sm text-primary underline-offset-4 hover:underline">
                                    Upload new picture
                                </label>
                                <Input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarFileChange} accept="image/png, image/jpeg, image/jpg" />
                                {avatarPreview && (
                                    <Button type="button" variant="link" size="sm" className="text-destructive" onClick={removeAvatarImage}>Remove</Button>
                                )}
                            </div>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
                />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your current password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <FormField
                control={form.control}
                name="qrCode"
                render={() => (
                    <FormItem>
                        <FormLabel>QR Code for Payments (Optional)</FormLabel>
                        <FormControl>
                             <div className="flex items-center justify-center w-full">
                                <label htmlFor="qr-dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG or JPEG</p>
                                    </div>
                                    <Input id="qr-dropzone-file" type="file" className="hidden" onChange={handleQrFileChange} accept="image/png, image/jpeg, image/jpg" />
                                </label>
                            </div> 
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
              />

              {qrPreview && (
                <div className="relative w-48 h-48 mx-auto">
                    <Image src={qrPreview} alt="QR Code preview" layout="fill" className="object-cover rounded-md" />
                    <button
                        type="button"
                        onClick={removeQrImage}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-75 hover:opacity-100 transition-opacity"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
