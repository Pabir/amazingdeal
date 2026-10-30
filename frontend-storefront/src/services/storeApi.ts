import {
  StoreInfo,
  Product,
  OrderResponse,
  RazorpayCreateOrderRequest,
  RazorpayCreateOrderResponse,
  RazorpayVerifyRequest,
  RazorpayVerifyResponse,
} from '../types';
 
const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'http://localhost:8080';
    }
    if (host.includes('workers.dev') || host.includes('pages.dev')) {
      return 'https://amazingdeal-backend.onrender.com';
    }
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('api.amazingdeal.co.in')) {
    return envUrl;
  }

  return 'https://amazingdeal-backend.onrender.com';
};

const API_BASE = getApiBase();

export class StoreApi {
  public static async getStoreInfo(subdomain: string): Promise<StoreInfo> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/store/info?subdomain=${encodeURIComponent(subdomain)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend store/info unreachable, using demo store profile:', e);
    }

    // High quality demo fallback store profile
    return {
      id: 'd3b07384-d113-40f4-8a1a-4d23253b2d1d',
      storeName: 'Sharma General & Grocery Store',
      subdomain,
      storeCategory: 'Daily Essentials & Groceries',
      storeAddress: 'Shop #4, Gandhi Market, Main Road',
      ownerPhone: '9876543210',
      upiVpa: `${subdomain}@okaxis`,
      deliveryRadiusKm: 5.0,
      deliveryCharge: 30.0,
      freeDeliveryAbove: 499.0,
      minOrderAmount: 0.0,
      storeTimings: '8:00 AM - 10:00 PM',
      bannerUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    };
  }

  public static async getProducts(subdomain: string, category?: string): Promise<Product[]> {
    try {
      const url = new URL(`${API_BASE}/api/v1/store/products`);
      url.searchParams.set('subdomain', subdomain);
      if (category && category !== 'All') {
        url.searchParams.set('category', category);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend store/products unreachable, using demo catalog:', e);
    }

    // Default rich catalog for immediate testing
    return [
      {
        id: 'prod-1',
        title: 'Fresh Farm Cow Milk (1L)',
        description: 'Fresh pasteurized full cream milk from verified local dairy.',
        price: 66.0,
        comparePrice: 70.0,
        category: 'Dairy & Eggs',
        inventoryQuantity: 50,
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod-2',
        title: 'Whole Wheat Sharbati Atta (5kg)',
        description: '100% pure stone ground whole wheat flour with natural dietary fiber.',
        price: 245.0,
        comparePrice: 280.0,
        category: 'Grains & Flours',
        inventoryQuantity: 30,
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod-3',
        title: 'Organic Royal Basmati Rice (1kg)',
        description: 'Aged long-grain aromatic royal basmati rice.',
        price: 140.0,
        comparePrice: 160.0,
        category: 'Grains & Flours',
        inventoryQuantity: 40,
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod-4',
        title: 'Pure Desi Danedar Ghee (1L)',
        description: 'Traditional bilona churned pure cow ghee with rich golden aroma.',
        price: 590.0,
        comparePrice: 650.0,
        category: 'Dairy & Eggs',
        inventoryQuantity: 25,
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod-5',
        title: 'Tata Tea Gold (500g)',
        description: 'Exquisite blend of Assam tea leaves with gently rolled long leaves.',
        price: 285.0,
        comparePrice: 320.0,
        category: 'Beverages',
        inventoryQuantity: 60,
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'prod-6',
        title: 'Premium Roasted Salted Cashews (250g)',
        description: 'Crunchy jumbo Goa cashews lightly salted and vacuum packed.',
        price: 260.0,
        comparePrice: 310.0,
        category: 'Dry Fruits & Snacks',
        inventoryQuantity: 35,
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
      },
    ];
  }

  public static async placeOrder(subdomain: string, orderData: any, token?: string | null): Promise<OrderResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/v1/store/orders?subdomain=${encodeURIComponent(subdomain)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    if (res.ok) {
      return await res.json();
    }

    let errMsg = `Failed to place order (HTTP ${res.status})`;
    try {
      const errJson = await res.json();
      errMsg = errJson.message || errJson.error || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  public static async checkSubdomain(subdomain: string): Promise<{ available: boolean; subdomain: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend check-subdomain offline fallback:', e);
    }
    // Fallback: check format locally
    const clean = subdomain.trim().toLowerCase();
    const isValid = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(clean);
    return {
      available: isValid,
      subdomain: clean,
      message: isValid ? 'Subdomain looks good!' : 'Format must be lowercase letters, numbers, hyphens (min 3 chars)',
    };
  }

  public static async createRazorpayOrder(data: RazorpayCreateOrderRequest): Promise<RazorpayCreateOrderResponse> {
    const res = await fetch(`${API_BASE}/api/v1/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Failed to initialize payment order with gateway.');
  }

  public static async verifyRazorpayPayment(data: RazorpayVerifyRequest): Promise<RazorpayVerifyResponse> {
    const res = await fetch(`${API_BASE}/api/v1/razorpay/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Payment verification failed. Please complete checkout with a valid payment method.');
  }

  public static async getRazorpayConfig(): Promise<{ keyId: string; companyName: string; currency: string }> {
    const res = await fetch(`${API_BASE}/api/v1/razorpay/config`);
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Failed to retrieve payment configuration.');
  }


  public static async registerStore(storeData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/api/v1/auth/register-store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Store registration failed' }));
      throw new Error(err.message || 'Store registration failed');
    }

    return await res.json();
  }

  // Delivery & Pincode Serviceability Check
  public static async checkServiceability(subdomain: string, pincode: string): Promise<{
    serviceable: boolean;
    message: string;
    estimatedDeliveryDate?: string;
    deliveryCharge?: number;
    courierName?: string;
    fulfillmentPartner?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/store/shipping/check-serviceability?subdomain=${encodeURIComponent(subdomain)}&pincode=${encodeURIComponent(pincode)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Pincode check offline:', e);
    }
    // Fallback
    return {
      serviceable: true,
      message: 'Delivery available in this area',
      estimatedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryCharge: 30,
      courierName: 'Store Local Delivery',
      fulfillmentPartner: 'OWN_RIDER',
    };
  }

  // Merchant BYOK Razorpay Order Creation
  public static async createMerchantRazorpayOrder(
    subdomain: string,
    amount: number,
    customerName: string,
    customerPhone: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/api/v1/store/payment/razorpay/create-order?subdomain=${encodeURIComponent(subdomain)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, customerName, customerPhone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Razorpay order creation failed' }));
      throw new Error(err.error || 'Failed to initiate Razorpay payment');
    }
    return await res.json();
  }

  // Merchant BYOK Razorpay Verification
  public static async verifyMerchantRazorpayPayment(
    subdomain: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<{ verified: boolean; paymentId: string }> {
    const res = await fetch(`${API_BASE}/api/v1/store/payment/razorpay/verify?subdomain=${encodeURIComponent(subdomain)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
    });
    if (!res.ok) {
      throw new Error('Razorpay payment verification failed');
    }
    return await res.json();
  }
}

