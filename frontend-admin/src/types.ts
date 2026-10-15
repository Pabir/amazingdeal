export interface Tenant {
  id: string;
  storeName: string;
  subdomain: string;
  customDomain?: string;
  ownerPhone: string;
  ownerEmail: string;
  status: string;
  storeCategory?: string;
  storeAddress?: string;
  upiVpa?: string;
  deliveryRadiusKm?: number;
  deliveryCharge?: number;
  freeDeliveryAbove?: number;
  minOrderAmount?: number;
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
  tracksInventory: boolean;
  imageUrl?: string;
  category?: string;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT';
  createdAt?: string;
}

export interface OrderItem {
  productId?: string;
  title: string;
  price: number;
  quantity: number;
  itemTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryType: 'DELIVERY' | 'PICKUP';
  paymentMethod: 'COD' | 'UPI_ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: 'PLACED' | 'ACCEPTED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  deliveryCharge: number;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
}

export interface OrderStats {
  totalOrders: number;
  placedOrders: number;
  acceptedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  tenantId: string;
  storeName: string;
  subdomain: string;
  storefrontUrl: string;
  ownerEmail: string;
  ownerPhone: string;
  upiVpa?: string;
}
