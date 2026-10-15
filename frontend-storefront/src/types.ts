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
