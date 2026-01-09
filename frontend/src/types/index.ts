export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  role: 'admin' | 'seller' | 'buyer';
  phone?: string;
  phoneVerified?: boolean;
  businessName?: string;
  alias?: string;
  theme?: Theme;
  businessDescription?: string;
  businessLogo?: string;
  businessBanner?: string;
  isApproved?: boolean;
  isActive?: boolean;
  isSuspended?: boolean;
  trialEndsAt?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  // SEO fields
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  seoKeywords?: string[];
  seoLocalArea?: string;
  // Social media handles
  instagramHandle?: string;
  facebookHandle?: string;
  // Seller video
  sellerVideo?: string;
}

export type Theme = 'ocean' | 'sunset' | 'forest' | 'midnight' | 'rose' | 'minimal';

export interface PriceTier {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
}

export interface Product {
  _id: string;
  seller: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  basePrice: number;
  priceTiers: PriceTier[];
  minimumOrderQuantity: number;
  images: string[];
  video?: {
    type: 'file' | 'link';
    url: string;
  };
  isActive: boolean;
  stock: number;
  unit: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  // Promotion fields (computed)
  hasPromotion?: boolean;
  promotion?: {
    name: string;
    discountType: 'percentage' | 'absolute';
    discountValue: number;
  };
  discountedPrice?: number;
}

export interface Promotion {
  _id: string;
  seller: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'absolute';
  discountValue: number;
  applyToAll: boolean;
  products: Product[] | string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  code?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface Store {
  alias?: string;
  sellerId?: string;
  businessName: string;
  businessDescription?: string;
  theme: Theme;
  logo?: string;
  banner?: string;
  phone?: string;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  seoKeywords?: string[];
  seoLocalArea?: string;
  instagramHandle?: string;
  facebookHandle?: string;
  sellerVideo?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

