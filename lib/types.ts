export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  features: string[];
  image_url: string;
  rating: number;
  reviews: number;
  customerReviews?: Review[];
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  userName: string;
  date: string;
  helpful: number;
}

export interface ProductSuggestion {
  productId: string;
  reason: string;
  confidence: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  userId: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: Date;
} 