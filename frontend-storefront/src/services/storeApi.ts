import { StoreInfo, Product, OrderResponse } from '../types';
 
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
    ? 'https://amazingdeal-backend.onrender.com'
    : 'http://localhost:8080');

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

  public static async placeOrder(subdomain: string, orderData: any): Promise<OrderResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/store/orders?subdomain=${encodeURIComponent(subdomain)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend order placement offline fallback:', e);
    }

    // Client-side fallback order generation with live UPI QR payload
    const total = orderData.items.reduce(
      (acc: number, item: any) => acc + item.price * item.quantity,
      0
    );
    const deliveryFee = orderData.deliveryType === 'PICKUP' || total >= 499 ? 0 : 30;
    const grandTotal = total + deliveryFee;
    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const upiUri = `upi://pay?pa=${encodeURIComponent(subdomain + '@okaxis')}&pn=${encodeURIComponent(
      subdomain.toUpperCase() + ' STORE'
    )}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order ' + orderNumber)}`;

    return {
      id: 'ord-' + Date.now(),
      orderNumber,
      storeName: subdomain.toUpperCase() + ' Store',
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress,
      deliveryType: orderData.deliveryType,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      totalAmount: grandTotal,
      deliveryCharge: deliveryFee,
      items: orderData.items.map((i: any) => ({
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        itemTotal: i.price * i.quantity,
      })),
      createdAt: new Date().toISOString(),
      upiUri,
      upiVpa: `${subdomain}@okaxis`,
    };
  }
}
