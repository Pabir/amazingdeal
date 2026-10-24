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

  // Payment Options
  paymentModesJson?: string;
  customUpiQrUrl?: string;
  razorpayByokEnabled?: boolean;
  razorpayKeyId?: string;
  cashfreeByokEnabled?: boolean;
  cashfreeAppId?: string;
  codEnabled?: boolean;
  codExtraCharge?: number;
  codMinAmount?: number;
  codMaxAmount?: number;
  codOtpRequired?: boolean;

  // Delivery & Logistics Options
  deliveryModesJson?: string;
  allowedPincodesText?: string;
  distanceTiersJson?: string;
  deliveryTimeSlotsJson?: string;
  expressDeliveryEnabled?: boolean;
  expressDeliveryMinutes?: number;
  expressDeliveryFee?: number;
  shiprocketEnabled?: boolean;
  shiprocketPricingRule?: string;
  shiprocketFlatFee?: number;
  shiprocketFreeAbove?: number;
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
  paymentMethod: 'COD' | 'UPI_ONLINE' | 'RAZORPAY_BYOK' | 'DIRECT_UPI';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: string;
  totalAmount: number;
  deliveryCharge: number;
  codExtraCharge?: number;
  pincode?: string;
  expectedDeliveryDate?: string;
  deliveryTimeSlot?: string;
  fulfillmentPartner?: string;
  shiprocketAwbCode?: string;
  shippingLabelUrl?: string;
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

export interface RazorpayCreateOrderRequest {
  planId: string;
  amount: number;
  firstname: string;
  email?: string;
  phone?: string;
  subdomain?: string;
  storeName?: string;
  currency?: string;
}

export interface RazorpayCreateOrderResponse {
  orderId: string;
  keyId: string;
  amountInPaise: number;
  amountInRupees: number;
  currency: string;
  planId: string;
  subdomain: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
}

export interface RazorpayVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  planId?: string;
  subdomain?: string;
}

export interface RazorpayVerifyResponse {
  verified: boolean;
  status: string;
  orderId: string;
  paymentId: string;
  planId: string;
  subdomain: string;
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


