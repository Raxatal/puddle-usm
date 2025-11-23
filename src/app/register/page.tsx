
"use client";

import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PuddleLogo } from '@/components/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string()
    .email({ message: 'Please enter a valid email.' })
    .refine(email => email.endsWith('@student.usm.my'), {
      message: 'Please use a valid USM student email (@student.usm.my).',
    }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export default function RegisterPage() {
  const router = useRouter();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      // Create a user document in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        id: user.uid,
        name: values.name,
        email: values.email,
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
        isVerified: false, // Or set to true based on email verification status
      });

      toast({
        title: "Account Created",
        description: "You have been successfully registered.",
      });
      router.push('/');
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          description = "This email address is already in use. Please log in or use a different email.";
          break;
        case 'auth/invalid-email':
          description = "The email address is not valid. Please check and try again.";
          break;
        case 'auth/weak-password':
          description = "The password is too weak. It must be at least 8 characters long.";
          break;
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: description,
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
              <PuddleLogo className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join the exclusive USM student marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ali bin Abu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>USM Student Email</FormLabel>
                    <FormControl>
                      <Input placeholder="yourname@student.usm.my" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Create Account</Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
