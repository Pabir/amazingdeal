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
  gstin?: string;
  pan?: string;
  stateCode?: string;
  invoicePrefix?: string;
  invoiceTerms?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;

  // Payment BYOK & Gateway
  paymentModesJson?: string;
  customUpiQrUrl?: string;
  razorpayByokEnabled?: boolean;
  razorpayKeyId?: string;
  hasRazorpaySecret?: boolean;
  razorpayKeySecret?: string;
  cashfreeByokEnabled?: boolean;
  cashfreeAppId?: string;
  cashfreeSecretKey?: string;
  codEnabled?: boolean;
  codExtraCharge?: number;
  codMinAmount?: number;
  codMaxAmount?: number;
  codOtpRequired?: boolean;

  // Delivery & Logistics
  deliveryModesJson?: string;
  allowedPincodesText?: string;
  distanceTiersJson?: string;
  deliveryTimeSlotsJson?: string;
  expressDeliveryEnabled?: boolean;
  expressDeliveryMinutes?: number;
  expressDeliveryFee?: number;
  shiprocketEnabled?: boolean;
  shiprocketEmail?: string;
  hasShiprocketPassword?: boolean;
  shiprocketPassword?: string;
  shiprocketPickupLocation?: string;
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
  tracksInventory: boolean;
  imageUrl?: string;
  imagesJson?: string;
  category?: string;
  hsnSac?: string;
  gstRate?: number;
  barcode?: string;
  unit?: string;
  purchasePrice?: number;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT';
  createdAt?: string;
}

export interface Party {
  id: string;
  partyType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  partyName: string;
  companyName?: string;
  gstin?: string;
  phone: string;
  email?: string;
  pan?: string;
  billingAddress?: string;
  billingStateCode?: string;
  shippingAddress?: string;
  openingBalance?: number;
  openingBalanceType?: 'RECEIVABLE' | 'PAYABLE';
  currentBalance: number; // positive = customer owes merchant (Lene Hain), negative = merchant owes supplier (Dene Hain)
  creditLimit?: number;
  creditPeriodDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  productId?: string;
  itemName: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPct?: number;
  gstRate?: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  partyId?: string;
  partyName: string;
  partyPhone?: string;
  partyGstin?: string;
  partyAddress?: string;
  documentType: 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'ESTIMATE' | 'PROFORMA' | 'DELIVERY_CHALLAN' | 'PURCHASE_BILL' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  invoiceNumber: string;
  referenceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  placeOfSupply: string;
  isReverseCharge?: boolean;
  subtotal: number;
  discountType?: 'FIXED' | 'PERCENTAGE';
  discountAmount?: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount?: number;
  roundOff: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
  channel?: 'POS_COUNTER' | 'ONLINE_STOREFRONT' | 'B2B_SALES';
  onlineOrderId?: string;
  items: InvoiceItem[];
  notes?: string;
  termsConditions?: string;
  createdAt: string;
  updatedAt?: string;
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
  codExtraCharge?: number;
  items: OrderItem[];
  notes?: string;
  pincode?: string;
  expectedDeliveryDate?: string;
  deliveryTimeSlot?: string;
  deliveryBoyName?: string;
  deliveryBoyPhone?: string;
  fulfillmentPartner?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  shiprocketAwbCode?: string;
  shiprocketCourierName?: string;
  shippingLabelUrl?: string;
  courierTrackingUrl?: string;
  gatewayProvider?: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  codOtpVerified?: boolean;
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
  suggestedPrice: number | string;
  comparePrice?: number | string;
  tags?: string[];
  keyHighlights?: string[];
  ingredientsOrSpecs?: string;
  estimatedUnit?: string;
  imageUrl?: string;
  imagesJson?: string;
  angles?: AiPhotoAngle[];
  inventoryQuantity: number | string;
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
