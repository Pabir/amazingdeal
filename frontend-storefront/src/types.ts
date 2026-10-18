export interface StoreInfo {
  id: string;
  storeName: string;
  subdomain: string;
  storeCategory?: string;
  storeAddress?: string;
  ownerPhone: string;
  upiVpa?: string;
  deliveryRadiusKm?: number;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  minOrderAmount: number;
  storeTimings?: string;
  bannerUrl?: string;
  logoUrl?: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  comparePrice?: number;
  inventoryQuantity: number;
  imageUrl?: string;
  category?: string;
  status: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryType: 'DELIVERY' | 'PICKUP';
  paymentMethod: 'COD' | 'UPI_ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: string;
  totalAmount: number;
  deliveryCharge: number;
  items: Array<{
    title: string;
    price: number;
    quantity: number;
    itemTotal: number;
  }>;
  createdAt: string;
  upiUri?: string;
  upiQrBase64?: string;
  upiVpa?: string;
}

export interface CustomerAddress {
  id?: string;
  label: string;
  recipientName?: string;
  recipientPhone?: string;
  addressLine: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  isDefault?: boolean;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface CustomerAuthSession {
  token: string;
  customer: CustomerProfile;
  addresses: CustomerAddress[];
}

export type SubscriptionPlanId = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  billingText: string;
  price: number;
  originalPrice?: number;
  monthlyEquivalent: number;
  popular?: boolean;
  features: string[];
}

export interface SubdomainCheckResponse {
  available: boolean;
  subdomain: string;
  message: string;
}

export interface PayUInitiateResponse {
  actionUrl: string;
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
}

export interface PayUVerifyResponse {
  verified: boolean;
  status: string;
  txnid: string;
  planId: string;
  subdomain: string;
  message: string;
}

export interface YoupiInitiateResponse {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  planId: string;
  subdomain: string;
  storeName: string;
  upiUri: string;
  upiQrBase64: string;
  merchantVpa: string;
  merchantName: string;
  checkoutUrl: string;
  statusUrl: string;
  status: string; // PENDING, SUCCESS, FAILED, EXPIRED
  gatewayOnline: boolean;
  message: string;
}

export interface YoupiStatusResponse {
  orderId: string;
  status: string;
  verified: boolean;
  amount: number;
  utr?: string;
  planId?: string;
  subdomain?: string;
  message: string;
}

export interface MerchantRegisterRequest {
  storeName: string;
  subdomain: string;
  ownerPhone: string;
  ownerEmail: string;
  password: string;
  storeCategory?: string;
  storeAddress?: string;
  upiVpa?: string;
  subscriptionPlan?: string;
  subscriptionPaymentRef?: string;
}

export interface MerchantAuthResponse {
  token: string;
  tokenType: string;
  tenantId: string;
  storeName: string;
  subdomain: string;
  storefrontUrl: string;
  ownerEmail: string;
  ownerPhone: string;
  upiVpa: string;
}


