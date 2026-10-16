import { AuthResponse, Order, OrderStats, Product, Tenant } from '../types';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
    ? 'https://amazingdeal-backend.onrender.com'
    : 'http://localhost:8080');

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('ad_auth_token');
  }

  private static getTenantId(): string | null {
    return localStorage.getItem('ad_tenant_id');
  }

  public static setAuth(auth: AuthResponse) {
    localStorage.setItem('ad_auth_token', auth.token);
    localStorage.setItem('ad_tenant_id', auth.tenantId);
    localStorage.setItem('ad_subdomain', auth.subdomain);
    localStorage.setItem('ad_store_name', auth.storeName);
    localStorage.setItem('ad_owner_email', auth.ownerEmail || '');
    localStorage.setItem('ad_owner_phone', auth.ownerPhone || '');
    localStorage.setItem('ad_upi_vpa', auth.upiVpa || '');
  }

  public static clearAuth() {
    localStorage.removeItem('ad_auth_token');
    localStorage.removeItem('ad_tenant_id');
    localStorage.removeItem('ad_subdomain');
    localStorage.removeItem('ad_store_name');
    localStorage.removeItem('ad_owner_email');
    localStorage.removeItem('ad_owner_phone');
    localStorage.removeItem('ad_upi_vpa');
  }

  public static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const tenantId = this.getTenantId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errMessage = `HTTP Error ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.details && typeof errJson.details === 'object') {
            errMessage = Object.values(errJson.details).join(', ');
          } else {
            errMessage = errJson.message || errJson.error || JSON.stringify(errJson);
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errMessage);
      }

      if (options.headers && (options.headers as Record<string, string>)['Accept'] === 'text/plain') {
        return (await response.text()) as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.warn(`API call ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Auth
  public static async registerStore(data: any): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/register-store', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async login(data: any): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async getMe(): Promise<Tenant> {
    return this.request<Tenant>('/api/v1/auth/me');
  }

  // Products
  public static async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/api/v1/admin/products');
  }

  public static async createProduct(product: Partial<Product>): Promise<Product> {
    return this.request<Product>('/api/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  public static async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/api/v1/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  public static async toggleStock(id: string, status: 'ACTIVE' | 'OUT_OF_STOCK'): Promise<Product> {
    return this.request<Product>(`/api/v1/admin/products/${id}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public static async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/api/v1/admin/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  public static async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/v1/admin/orders');
  }

  public static async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.request<Order>(`/api/v1/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public static async getOrderStats(): Promise<OrderStats> {
    return this.request<OrderStats>('/api/v1/admin/orders/stats');
  }

  public static async getThermalReceipt(orderId: string): Promise<string> {
    const token = this.getToken();
    const tenantId = this.getTenantId();
    const response = await fetch(`${API_BASE}/api/v1/admin/orders/${orderId}/receipt`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'X-Tenant-ID': tenantId || '',
      },
    });
    return response.text();
  }

  // Media
  public static async getMediaUploadUrl(fileName: string, contentType: string) {
    return this.request<{ uploadUrl: string; publicUrl: string; key: string }>(
      '/api/v1/admin/media/upload-url',
      {
        method: 'POST',
        body: JSON.stringify({ fileName, contentType }),
      }
    );
  }
}
