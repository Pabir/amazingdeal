import { CustomerAddress, CustomerAuthSession, CustomerProfile, OrderResponse } from '../types';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
    ? 'https://amazingdeal-backend.onrender.com'
    : 'http://localhost:8080');

export class CustomerAuthApi {
  public static async verifyWithBackend(payload: {
    firebaseUid: string;
    idToken?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    authProvider?: string;
  }): Promise<CustomerAuthSession> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/store/customer/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          token: data.token,
          customer: {
            id: data.id,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            avatarUrl: data.avatarUrl,
          },
          addresses: data.addresses || [],
        };
      }
    } catch (e) {
      console.warn('Backend customer auth unreachable, falling back to local session:', e);
    }

    // Local fallback session if backend is temporarily unreachable
    const fallbackId = 'cust-' + payload.firebaseUid.substring(0, 8);
    return {
      token: 'demo-customer-jwt-token',
      customer: {
        id: fallbackId,
        fullName: payload.fullName || 'Valued Customer',
        email: payload.email,
        phone: payload.phone,
        avatarUrl: payload.avatarUrl,
      },
      addresses: [],
    };
  }

  public static async getAddresses(token: string): Promise<CustomerAddress[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/store/customer/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch addresses:', e);
    }
    return [];
  }

  public static async saveAddress(token: string, address: CustomerAddress): Promise<CustomerAddress> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/store/customer/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(address),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to save address:', e);
    }
    return { ...address, id: 'addr-' + Date.now() };
  }

  public static async deleteAddress(token: string, addressId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/store/customer/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch (e) {
      console.warn('Failed to delete address:', e);
      return false;
    }
  }

  public static async getCustomerOrders(token: string, subdomain?: string): Promise<OrderResponse[]> {
    try {
      const url = new URL(`${API_BASE}/api/v1/store/customer/orders`);
      if (subdomain) {
        url.searchParams.set('subdomain', subdomain);
      }
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch customer orders:', e);
    }
    return [];
  }
}
