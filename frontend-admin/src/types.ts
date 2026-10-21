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
  imagesJson?: string;
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

export interface ChatGptStatus {
  connected: boolean;
  accountEmail?: string;
  planTier?: string;
  expiresAt?: string;
  hasCustomApiKey: boolean;
  maskedApiKey?: string;
  hasCustomGeminiKey?: boolean;
  maskedGeminiKey?: string;
  aiProviderPreference?: 'AUTO' | 'GEMINI' | 'OPENAI';
  activeProvider?: 'GEMINI' | 'OPENAI' | 'DEMO' | 'DISCONNECTED';
  connectionType: 'CHATGPT_SUBSCRIPTION' | 'CUSTOM_API_KEY' | 'GEMINI_API_KEY' | 'GEMINI_AND_OPENAI' | 'DISCONNECTED';
}

export interface ChatGptAuthUrlResponse {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export interface GeneratedProduct {
  title: string;
  description: string;
  category: string;
  suggestedPrice: number;
  comparePrice?: number;
  tags?: string[];
  keyHighlights?: string[];
  ingredientsOrSpecs?: string;
  estimatedUnit?: string;
  imageUrl?: string;
  imagesJson?: string;
  angles?: AiPhotoAngle[];
  inventoryQuantity: number;
  poweredBy?: string;
}

export interface AiPhotoAngle {
  angle: string;       // "0°", "45°", "90°", "180°", "Podium", "Macro"
  label: string;       // "Front View", "Quarter Angle", "Side Profile", "Rear View", etc.
  imageUrl: string;
  isPrimary?: boolean;
}

export interface AiPhotoEnhanceRequest {
  command?: string;
  productTitle?: string;
  category?: string;
  base64Image?: string;
  currentImageUrl?: string;
  customPrompt?: string;
  provider?: string;
}

export interface AiPhotoEnhanceResponse {
  command: string;
  styleName: string;
  description: string;
  primaryImageUrl: string;
  angles: AiPhotoAngle[];
  suggestedCommands: string[];
  poweredBy?: string;
}
