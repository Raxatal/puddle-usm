export type Category = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  isVerified: boolean;
  qrCodeUrl?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  seller: User;
  imageUrls: string[];
  dateAdded: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  status: 'Unpaid' | 'Paid' | 'Confirmed' | 'Successful';
};

export type Message = {
  id: string;
  text?: string;
  imageUrl?: string;
  senderId: string;
  timestamp: any; // Firestore timestamp
};

export type Purchase = {
    id: string; // Corresponds to productId
    productName: string;
    productImage: string;
    price: number;
    sellerId: string;
    sellerName: string;
    buyerName: string;
    purchaseDate: any; // Firestore timestamp
    status: 'Pending' | 'Successful' | 'Delivered' | 'Cancelled';
};

export type Report = {
  id: string;
  productId: string;
  productName: string;
  reportedBy: {
    id: string;
    name: string;
  };
  reason: string;
  date: any; // Firestore timestamp
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: any; // Firestore timestamp
  read: boolean;
  actionUrl?: string;
  actionType?: 'confirm_transaction';
  metadata?: {
    buyerId?: string;
    productId?: string;
    purchaseId?: string;
  }
};
