
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PuddleLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Menu, User, List, LogOut, MessageCircle, Home, PlusCircle, Inbox } from 'lucide-react';
import { useAuth } from '@/firebase';
import { useCart } from '@/context/cart-context';
import { signOut } from 'firebase/auth';

export function Header() {
  const router = useRouter();
  const { user, auth } = useAuth();
  const { cartCount } = useCart();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Browse', icon: List },
    { href: '/products/new', label: 'Sell', icon: PlusCircle, auth: true },
    { href: '/messages', label: 'Messages', icon: MessageCircle, auth: true },
    { href: '/inbox', label: 'Inbox', icon: Inbox, auth: true },
  ];
  
  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const userInitial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U';

  const LogoutDialog = ({ children, onLogout, asItem }: { children: React.ReactNode, onLogout: () => void, asItem?: boolean }) => {
    const Trigger = asItem ? DropdownMenuItem : Button;
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {asItem ? (
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <LogOut className="mr-2 h-4 w-4" />Log out
                    </DropdownMenuItem>
                ) : (
                    <Button variant="ghost" className="justify-start"><LogOut className="mr-2 h-4 w-4" />Log out</Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You will be returned to the home page.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onLogout}>Log Out</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary-foreground">
            <PuddleLogo className="h-6 w-6" />
            <span className="hidden sm:inline">Puddle USM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.filter(link => !link.auth || (link.auth && user)).map(link => (
              <Button key={link.href} variant="ghost" asChild className="text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-primary-foreground hover:bg-accent hover:text-accent-foreground">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{cartCount}</Badge>}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || ''} />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/messages"><MessageCircle className="mr-2 h-4 w-4" />Messages</Link></DropdownMenuItem>
                <LogoutDialog onLogout={handleLogout} asItem>
                    <LogOut className="mr-2 h-4 w-4" />Log out
                </LogoutDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild className="text-primary-foreground hover:bg-accent hover:text-accent-foreground"><Link href="/login">Log In</Link></Button>
                <Button variant="secondary" asChild><Link href="/register">Sign Up</Link></Button>
            </div>
          )}

          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-accent hover:text-accent-foreground"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.filter(link => !link.auth || (link.auth && user)).map(link => (
                     <Button key={link.href} variant="ghost" className="justify-start" asChild onClick={() => setSheetOpen(false)}>
                      <Link href={link.href}><link.icon className="mr-2 h-4 w-4" />{link.label}</Link>
                    </Button>
                  ))}
                  <DropdownMenuSeparator />
                  {user ? (
                    <>
                      <Button variant="ghost" className="justify-start" asChild onClick={() => setSheetOpen(false)}><Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link></Button>
                      <LogoutDialog onLogout={() => { handleLogout(); setSheetOpen(false); }}>
                        <LogOut className="mr-2 h-4 w-4" />Log out
                      </LogoutDialog>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" className="justify-start" asChild onClick={() => setSheetOpen(false)}><Link href="/login">Log In</Link></Button>
                      <Button className="w-full" asChild onClick={() => setSheetOpen(false)}><Link href="/register">Sign Up</Link></Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
