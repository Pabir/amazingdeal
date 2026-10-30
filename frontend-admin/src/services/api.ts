import { AuthResponse, Order, OrderStats, Product, Tenant, ChatGptStatus, ChatGptAuthUrlResponse, GeneratedProduct, AiPhotoEnhanceRequest, AiPhotoEnhanceResponse, Party, Invoice } from '../types';

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

  public static isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    if (token.startsWith('demo-') || token === 'demo-token-123') return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(payloadBase64));
      if (!payload.exp) return false;
      return payload.exp * 1000 < Date.now();
    } catch {
      return false;
    }
  }

  public static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired(token)) {
      this.clearAuth();
      return false;
    }
    return true;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const tenantId = this.getTenantId();

    // Check if the current stored token has expired prior to making authenticated requests
    if (token && endpoint.startsWith('/api/v1/admin') && this.isTokenExpired(token)) {
      this.clearAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ad_session_expired'));
      }
      throw new Error('Your login session has expired. Please sign in again.');
    }

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
        if (response.status === 401 || (response.status === 403 && endpoint.startsWith('/api/v1/admin'))) {
          if (this.isTokenExpired(token)) {
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ad_session_expired'));
            }
            throw new Error('Your login session has expired. Please sign in again.');
          }
        }

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

        if ((response.status === 401 || response.status === 403) && (!errMessage || errMessage.toLowerCase() === 'forbidden')) {
          errMessage = 'Access denied / session expired. Please log out and sign in again.';
        }

        throw new Error(errMessage);
      }

      if (options.headers && (options.headers as Record<string, string>)['Accept'] === 'text/plain') {
        return (await response.text()) as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      let msg = err.message || 'Request failed';
      if (msg === 'Failed to fetch') {
        msg = 'Connection to server interrupted. Please check your network connection or try again in a moment.';
      }
      console.warn(`API call ${endpoint} failed:`, msg);
      throw new Error(msg);
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

  // AI & ChatGPT Plan Integration
  public static async getChatGptAuthUrl(): Promise<ChatGptAuthUrlResponse> {
    return this.request<ChatGptAuthUrlResponse>('/api/v1/admin/ai/chatgpt/auth-url');
  }

  public static async handleChatGptCallback(data: { code: string; codeVerifier?: string; state?: string }): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/chatgpt/callback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async getChatGptStatus(): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/chatgpt/status');
  }

  public static async disconnectChatGpt(): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/chatgpt/disconnect', {
      method: 'POST',
    });
  }

  public static async saveCustomApiKey(apiKey: string): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/chatgpt/custom-api-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  public static async saveCustomOpenAiApiKey(apiKey: string): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/openai/custom-api-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  public static async disconnectOpenAi(): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/openai/disconnect', {
      method: 'POST',
    });
  }

  public static async saveCustomGeminiApiKey(apiKey: string): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/gemini/custom-api-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  public static async disconnectGemini(): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/gemini/disconnect', {
      method: 'POST',
    });
  }

  public static async setAiProviderPreference(preference: 'AUTO' | 'GEMINI' | 'OPENAI'): Promise<ChatGptStatus> {
    return this.request<ChatGptStatus>('/api/v1/admin/ai/provider-preference', {
      method: 'POST',
      body: JSON.stringify({ preference }),
    });
  }

  public static async generateProductFromImage(data: {
    imageUrl?: string;
    base64Image?: string;
    preferredCategory?: string;
    additionalMerchantNotes?: string;
    simulateDemo?: boolean;
    provider?: 'GEMINI' | 'OPENAI' | 'AUTO';
    apiKey?: string;
  }): Promise<GeneratedProduct> {
    return this.request<GeneratedProduct>('/api/v1/admin/ai/generate-product', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async enhanceProductPhoto(data: AiPhotoEnhanceRequest): Promise<AiPhotoEnhanceResponse> {
    return this.request<AiPhotoEnhanceResponse>('/api/v1/admin/ai/enhance-photo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Parties & Khata (Vyapar)
  public static async getParties(type?: string, search?: string): Promise<Party[]> {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.append('type', type);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Party[]>(`/api/v1/admin/parties${query}`);
  }

  public static async getParty(id: string): Promise<Party> {
    return this.request<Party>(`/api/v1/admin/parties/${id}`);
  }

  public static async createParty(data: Partial<Party>): Promise<Party> {
    return this.request<Party>('/api/v1/admin/parties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateParty(id: string, data: Partial<Party>): Promise<Party> {
    return this.request<Party>(`/api/v1/admin/parties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteParty(id: string): Promise<void> {
    await this.request<void>(`/api/v1/admin/parties/${id}`, {
      method: 'DELETE',
    });
  }

  // Invoices & POS Billing (Vyapar)
  public static async getInvoices(filters?: {
    documentType?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    query?: string;
  }): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (filters?.documentType && filters.documentType !== 'ALL') params.append('documentType', filters.documentType);
    if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') params.append('paymentStatus', filters.paymentStatus);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.query) params.append('query', filters.query);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Invoice[]>(`/api/v1/admin/invoices${query}`);
  }

  public static async getInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/api/v1/admin/invoices/${id}`);
  }

  public static async createInvoice(data: any): Promise<Invoice> {
    return this.request<Invoice>('/api/v1/admin/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async convertInvoice(id: string, targetDocType: string): Promise<Invoice> {
    return this.request<Invoice>(`/api/v1/admin/invoices/${id}/convert?targetDocType=${encodeURIComponent(targetDocType)}`, {
      method: 'POST',
    });
  }

  public static async getInvoiceThermalReceipt(id: string, width: number = 80): Promise<string> {
    const token = this.getToken();
    const tenantId = this.getTenantId();
    const headers: Record<string, string> = { Accept: 'text/plain' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantId) headers['X-Tenant-ID'] = tenantId;

    const res = await fetch(`${API_BASE}/api/v1/admin/invoices/${id}/thermal-receipt?width=${width}`, { headers });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.text();
  }

  // Settings & Gateway BYOK / Logistics
  public static async getSettings(): Promise<any> {
    return this.request<any>('/api/v1/admin/settings');
  }

  public static async updateSettings(data: any): Promise<Tenant> {
    return this.request<Tenant>('/api/v1/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async testRazorpay(keyId: string, keySecret: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/v1/admin/settings/test-razorpay', {
      method: 'POST',
      body: JSON.stringify({ keyId, keySecret }),
    });
  }

  public static async testShiprocket(email: string, password: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/v1/admin/settings/test-shiprocket', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Logistics & Order Fulfillment
  public static async shipViaShiprocket(orderId: string): Promise<{
    success: boolean;
    message: string;
    awbCode: string;
    courierName: string;
    shippingLabelUrl: string;
    order: Order;
  }> {
    return this.request<any>(`/api/v1/admin/orders/${orderId}/ship-shiprocket`, {
      method: 'POST',
    });
  }

  public static async assignStoreRider(orderId: string, riderName: string, riderPhone: string): Promise<{
    success: boolean;
    message: string;
    whatsappDispatchText: string;
    whatsappDispatchUrl: string;
    order: Order;
  }> {
    return this.request<any>(`/api/v1/admin/orders/${orderId}/assign-rider`, {
      method: 'POST',
      body: JSON.stringify({ riderName, riderPhone }),
    });
  }

  // Bank & IFSC Details Lookup
  public static async lookupIfsc(code: string): Promise<{
    success: boolean;
    bank?: string;
    branch?: string;
    city?: string;
    state?: string;
    district?: string;
    message?: string;
  }> {
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean || clean.length !== 11) {
      return { success: false, message: 'IFSC must be exactly 11 characters' };
    }

    // 1. Direct browser fetch to open-source Razorpay IFSC API with instant CORS
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${clean}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          bank: data.BANK,
          branch: data.BRANCH,
          city: data.CITY,
          district: data.DISTRICT,
          state: data.STATE,
        };
      }
    } catch (e) {
      console.warn('Direct IFSC lookup failed, falling back to backend:', e);
    }

    // 2. Resilient fallback to backend proxy endpoint
    try {
      return await this.request<{
        success: boolean;
        bank?: string;
        branch?: string;
        city?: string;
        state?: string;
        district?: string;
        message?: string;
      }>(`/api/v1/admin/settings/lookup-ifsc?code=${clean}`);
    } catch (e: any) {
      return { success: false, message: e.message || 'IFSC code not found' };
    }
  }
}
