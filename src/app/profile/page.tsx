
"use client";

import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/product-card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Edit, LogOut } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { collectionGroup, doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import type { User as AppUser, Product, Purchase, Report } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


export default function ProfilePage() {
  const { user, auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [userListings, setUserListings] = useState<Product[]>([]);
  const [userSales, setUserSales] = useState<Purchase[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [isSalesLoading, setIsSalesLoading] = useState(true);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(true);
  const [isReportsLoading, setIsReportsLoading] = useState(true);

  const isAdmin = user?.email === 'admin@usm.my';

  // Fetch User Profile
  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setAppUser({id: docSnap.id, ...docSnap.data()} as AppUser);
        } else {
          setAppUser(null);
        }
      });
      return () => unsubscribe();
    } else if (!user) {
      setIsListingsLoading(false);
      setIsSalesLoading(false);
      setIsPurchasesLoading(false);
      setIsReportsLoading(false);
    }
  }, [user, firestore]);

  // Fetch User Listings
  useEffect(() => {
    if (!firestore || !user) return;
    setIsListingsLoading(true);
    const productsRef = collection(firestore, 'products');
    const q = query(productsRef, where("seller.id", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const listings = querySnapshot.docs.map(doc => ({ ...(doc.data() as Omit<Product, 'id'>), id: doc.id }));
        // Sort on the client side
        listings.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        setUserListings(listings);
        setIsListingsLoading(false);
    }, (error) => {
        console.error("Error fetching listings: ", error);
        setIsListingsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, user]);

  // Fetch User Sales
  useEffect(() => {
    if (!firestore || !user) return;
    setIsSalesLoading(true);
    const purchasesRef = collectionGroup(firestore, 'purchases');
    const q = query(
        purchasesRef, 
        where("sellerId", "==", user.uid),
        where("status", "==", "Successful"),
        orderBy("purchaseDate", "desc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const sales = querySnapshot.docs.map(doc => ({ ...(doc.data() as Omit<Purchase, 'id'>), id: doc.id }));
        setUserSales(sales);
        setIsSalesLoading(false);
    }, (error) => {
        console.error("Error fetching user sales: ", error);
        // This can fail if the required index is not created.
        if (error.message.includes("indexes?create_composite")) {
          toast({
            variant: "destructive",
            title: "Database Index Required",
            description: "The 'My Sales' feature needs a database index. Please check the browser console for a link to create it automatically.",
            duration: 10000,
          });
        }
        setIsSalesLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, user, toast]);

  // Fetch Purchase History
  useEffect(() => {
    if (!firestore || !user) return;
    setIsPurchasesLoading(true);
    const purchasesRef = collection(firestore, 'users', user.uid, 'purchases');
    const q = query(purchasesRef, orderBy("purchaseDate", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const purchases = querySnapshot.docs.map(doc => ({ ...(doc.data() as Omit<Purchase, 'id'>), id: doc.id }));
        setPurchaseHistory(purchases);
        setIsPurchasesLoading(false);
    }, (error) => {
        console.error("Error fetching purchases: ", error);
        setIsPurchasesLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, user]);

  // Fetch Reports (for Admins)
  useEffect(() => {
    if (!firestore || !isAdmin) {
        setIsReportsLoading(false);
        return;
    };
    setIsReportsLoading(true);
    const reportsRef = collection(firestore, 'reports');
    const q = query(reportsRef, orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedReports = querySnapshot.docs.map(doc => ({ ...(doc.data() as Omit<Report, 'id'>), id: doc.id }));
        setReports(fetchedReports);
        setIsReportsLoading(false);
    }, (error) => {
        console.error("Error fetching reports: ", error);
        setIsReportsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, isAdmin]);
  
  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const resolveReport = async (reportId: string) => {
    if (!firestore || !isAdmin) return;
    try {
        await deleteDoc(doc(firestore, 'reports', reportId));
        toast({
            title: "Report Resolved",
            description: "The report has been removed.",
        });
    } catch (error) {
        console.error("Error resolving report:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not resolve the report.",
        });
    }
  };

  if (!user && !appUser) {
     return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">Please log in</h2>
        <p className="text-muted-foreground">Log in to view your profile.</p>
        <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
      </div>
    );
  }
  
  if (!appUser) {
    return (
      <div className="text-center py-20">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  const TABS = [
    { value: 'listings', label: 'My Listings' },
    { value: 'sales', label: 'My Sales' },
    { value: 'purchases', label: 'Purchase History' },
    ...(isAdmin ? [{ value: 'reports', label: 'Reports' }] : [])
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={appUser.avatarUrl} alt={appUser.name} />
            <AvatarFallback className="text-3xl">{appUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold">{appUser.name}</h1>
            {appUser.isVerified && (
              <div className="flex items-center justify-center md:justify-start text-green-600 mt-1">
                <ShieldCheck className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Verified Student</span>
              </div>
            )}
             <p className="text-muted-foreground mt-1">Joined in {new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/profile/edit"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link></Button>
            {user && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive"><LogOut className="mr-2 h-4 w-4"/>Log Out</Button>
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
                            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList 
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)`}}
        >
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle>Your Active Listings ({userListings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isListingsLoading ? (
                 <p className="text-muted-foreground text-center py-8">Loading your listings...</p>
              ) : userListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userListings.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <h2 className="text-xl font-semibold">No listings yet</h2>
                    <p>When you list an item for sale, it will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Your Sales History</CardTitle>
            </CardHeader>
            <CardContent>
               {isSalesLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
               ) : userSales.length > 0 ? (
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSales.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <Image src={item.productImage} alt={item.productName} width={40} height={40} className="rounded-md object-cover" />
                            {item.productName}
                        </TableCell>
                        <TableCell>RM {item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.buyerName}</TableCell>
                        <TableCell>
                          {item.purchaseDate?.toDate ? format(item.purchaseDate.toDate(), 'PPP') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <h2 className="text-xl font-semibold">No sales yet</h2>
                    <p>Successful sales will appear here.</p>
                </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Your Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
               {isPurchasesLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
               ) : purchaseHistory.length > 0 ? (
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <Image src={item.productImage} alt={item.productName} width={40} height={40} className="rounded-md object-cover" />
                            {item.productName}
                        </TableCell>
                        <TableCell>RM {item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.sellerName}</TableCell>
                        <TableCell>
                          {item.purchaseDate?.toDate ? format(item.purchaseDate.toDate(), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'Successful' ? 'default' : 'secondary'}>{item.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <h2 className="text-xl font-semibold">No purchases yet</h2>
                    <p>Items you buy will appear here.</p>
                </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
        {isAdmin && (
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>User Reports</CardTitle>
                </CardHeader>
                <CardContent>
                   {isReportsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                   ) : reports.length > 0 ? (
                     <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Reported By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map(report => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                                <Link href={`/products/${report.productId}`} className="hover:underline text-primary">
                                    {report.productName}
                                </Link>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                            <TableCell>{report.reportedBy.name}</TableCell>
                            <TableCell>{report.date?.toDate ? format(report.date.toDate(), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="destructive" size="sm" onClick={() => resolveReport(report.id)}>Resolve</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                   ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <h2 className="text-xl font-semibold">No active reports</h2>
                        <p>All clear!</p>
                    </div>
                   )}
                </CardContent>
              </Card>
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
