const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data as T;
  }

  // Auth
  async register(email: string, password: string, name: string, role?: string) {
    return this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async barcodeLogin(barcode: string) {
    return this.request<{ user: User; token: string }>('/auth/barcode-login', {
      method: 'POST',
      body: JSON.stringify({ barcode }),
    });
  }

  async me() {
    return this.request<User>('/auth/me');
  }

  async getMyBarcode() {
    return this.request<{ barcode: string | null }>('/auth/my-barcode');
  }

  // Role requests
  async requestRolePromotion(requestedRole: string, reason?: string) {
    return this.request<RoleRequest>('/auth/role-requests', {
      method: 'POST',
      body: JSON.stringify({ requestedRole, reason }),
    });
  }

  async getRoleRequests(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request<RoleRequest[]>(`/auth/role-requests${params}`);
  }

  async decideRoleRequest(id: number, approved: boolean) {
    return this.request<RoleRequest>(`/auth/role-requests/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  }

  // Admin user management
  async adminCreateUser(email: string, password: string, name: string, role: string) {
    return this.request<{ user: User; token: string }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  async listUsers() {
    return this.request<UserWithCreator[]>('/auth/users');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async adminResetPassword(userId: number, newPassword: string) {
    return this.request<{ message: string }>(`/auth/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async deleteUser(userId: number) {
    return this.request<{ message: string }>(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async regenerateBarcode(userId: number) {
    return this.request<{ barcode: string }>(`/auth/users/${userId}/regenerate-barcode`, {
      method: 'POST',
    });
  }

  // Parts
  async getParts(search?: string, page?: number, limit?: number) {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (page) p.set('page', String(page));
    if (limit) p.set('limit', String(limit));
    const qs = p.toString();
    return this.request<{ parts: Part[]; pagination: Pagination }>(`/parts${qs ? '?' + qs : ''}`);
  }

  async createPart(sku: string, name: string, description?: string, condition?: PartCondition, minStock?: number, costCents?: number | null) {
    return this.request<Part>('/parts', {
      method: 'POST',
      body: JSON.stringify({ sku, name, description, condition, minStock, costCents }),
    });
  }

  async getPartById(id: number) {
    return this.request<Part>(`/parts/${id}`);
  }

  async updatePart(id: number, data: { sku?: string; name?: string; description?: string; condition?: PartCondition; minStock?: number; costCents?: number | null }) {
    return this.request<Part>(`/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePart(id: number) {
    return this.request<{ message: string }>(`/parts/${id}`, {
      method: 'DELETE',
    });
  }

  async generatePartBarcode(id: number) {
    return this.request<Part>(`/parts/${id}/generate-barcode`, {
      method: 'POST',
    });
  }

  async removeGroupMember(groupId: number, partId: number) {
    return this.request<{ message: string }>(`/interchange-groups/${groupId}/members/${partId}`, {
      method: 'DELETE',
    });
  }

  async removeFitment(partId: number, vehicleId: number) {
    return this.request<{ message: string }>(`/parts/${partId}/fitments/${vehicleId}`, {
      method: 'DELETE',
    });
  }

  async addFitment(partId: number, vehicleId: number) {
    return this.request<PartFitment>(`/parts/${partId}/fitments`, {
      method: 'POST',
      body: JSON.stringify({ vehicleId }),
    });
  }

  // Vehicles
  async getVehicles(search?: string, page?: number, limit?: number) {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (page) p.set('page', String(page));
    if (limit) p.set('limit', String(limit));
    const qs = p.toString();
    return this.request<{ vehicles: Vehicle[]; pagination: Pagination }>(`/vehicles${qs ? '?' + qs : ''}`);
  }

  async getVehicleMakes(year: number) {
    return this.request<string[]>(`/vehicles/makes?year=${year}`);
  }

  async getVehicleModels(year: number, make: string) {
    return this.request<{ id: number; model: string; trim: string | null }[]>(
      `/vehicles/models?year=${year}&make=${encodeURIComponent(make)}`
    );
  }

  async createVehicle(year: number, make: string, model: string, trim?: string) {
    return this.request<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify({ year, make, model, trim }),
    });
  }

  async updateVehicle(id: number, data: { year?: number; make?: string; model?: string; trim?: string | null }) {
    return this.request<Vehicle>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVehicle(id: number) {
    return this.request<{ message: string }>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // Interchange Groups
  async getInterchangeGroups() {
    return this.request<InterchangeGroup[]>('/interchange-groups');
  }

  async createInterchangeGroup(name: string, description?: string) {
    return this.request<InterchangeGroup>('/interchange-groups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async addGroupMember(groupId: number, partId: number) {
    return this.request<InterchangeGroupMember>(`/interchange-groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ partId }),
    });
  }

  // Locations
  async getLocations() {
    return this.request<Location[]>('/inventory/locations');
  }

  async createLocation(name: string) {
    return this.request<Location>('/inventory/locations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Inventory
  async receiveStock(partId: number, locationId: number, qty: number, reason?: string) {
    return this.request<InventoryEvent>('/inventory/receive', {
      method: 'POST',
      body: JSON.stringify({ partId, locationId, qty, reason }),
    });
  }

  async correctStock(partId: number, locationId: number, qty: number, reason: string) {
    return this.request<InventoryEvent>('/inventory/correct', {
      method: 'POST',
      body: JSON.stringify({ partId, locationId, qty, reason }),
    });
  }

  async returnStock(partId: number, locationId: number, qty: number, reason: string) {
    return this.request<InventoryEvent>('/inventory/return', {
      method: 'POST',
      body: JSON.stringify({ partId, locationId, qty, reason }),
    });
  }

  async getOnHand(partId?: number, locationId?: number) {
    const params = new URLSearchParams();
    if (partId) params.append('partId', String(partId));
    if (locationId) params.append('locationId', String(locationId));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<OnHand[]>(`/inventory/on-hand${query}`);
  }

  async getEvents(partId?: number) {
    const params = partId ? `?partId=${partId}` : '';
    return this.request<{ events: InventoryEvent[]; pagination: Pagination }>(`/inventory/events${params}`);
  }

  async getInventoryHistory(days?: number) {
    const params = days ? `?days=${days}` : '';
    return this.request<{ date: string; total: number }[]>(`/inventory/history${params}`);
  }

  async getTopMovers(days?: number, limit?: number) {
    const params = new URLSearchParams();
    if (days) params.append('days', String(days));
    if (limit) params.append('limit', String(limit));
    const qs = params.toString();
    return this.request<{ part: Part; eventCount: number; netChange: number }[]>(`/inventory/top-movers${qs ? '?' + qs : ''}`);
  }

  async getDeadStock(days?: number, limit?: number) {
    const params = new URLSearchParams();
    if (days) params.append('days', String(days));
    if (limit) params.append('limit', String(limit));
    const qs = params.toString();
    return this.request<{ part: Part; quantity: number; lastActivity: string | null; daysSinceActivity: number | null }[]>(`/inventory/dead-stock${qs ? '?' + qs : ''}`);
  }

  // Audit
  async getAuditLogs(query?: { entityType?: string; userId?: number; action?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (query?.entityType) params.append('entityType', query.entityType);
    if (query?.userId) params.append('userId', String(query.userId));
    if (query?.action) params.append('action', query.action);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    const qs = params.toString();
    return this.request<{ logs: AuditLog[]; pagination: Pagination }>(`/audit${qs ? '?' + qs : ''}`);
  }

  // Requests
  async getRequests(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request<{ requests: Request[]; pagination: Pagination }>(`/requests${params}`);
  }

  async createRequest(items: { partId: number; qtyRequested: number; locationId?: number }[], notes?: string) {
    return this.request<Request>('/requests', {
      method: 'POST',
      body: JSON.stringify({ items, notes }),
    });
  }

  async approveRequest(id: number) {
    return this.request<Request>(`/requests/${id}/approve`, {
      method: 'POST',
    });
  }

  async fulfillRequest(id: number) {
    return this.request<Request>(`/requests/${id}/fulfill`, {
      method: 'POST',
    });
  }

  async cancelRequest(id: number) {
    return this.request<Request>(`/requests/${id}/cancel`, {
      method: 'POST',
    });
  }

  // SKU / Barcode
  async getMakeCodes() {
    return this.request<MakeCode[]>('/sku/make-codes');
  }

  async getModelCodes(make?: string) {
    const params = make ? `?make=${encodeURIComponent(make)}` : '';
    return this.request<ModelCode[]>(`/sku/model-codes${params}`);
  }

  async getSystemCodes() {
    return this.request<SystemCode[]>('/sku/system-codes');
  }

  async getComponentCodes(systemCode?: string) {
    const params = systemCode ? `?system=${encodeURIComponent(systemCode)}` : '';
    return this.request<ComponentCode[]>(`/sku/component-codes${params}`);
  }

  async generateSku(input: { make: string; model: string; year: number; systemCode: string; componentCode: string; position?: string }) {
    return this.request<SkuGenerateResult>('/sku/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async lookupSku(sku: string) {
    return this.request<SkuLookupResult>(`/sku/lookup/${encodeURIComponent(sku)}`);
  }

  // ============================================
  // Part Images
  // ============================================

  async getPartImages(partId: number) {
    return this.request<PartImage[]>(`/parts/${partId}/images`);
  }

  async uploadPartImage(partId: number, file: File, isPrimary?: boolean): Promise<PartImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1]; // Remove data:... prefix
          const result = await this.request<PartImage>(`/parts/${partId}/images`, {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              data: base64,
              isPrimary,
            }),
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async getImage(imageId: number) {
    return this.request<PartImageFull>(`/images/${imageId}`);
  }

  getImageUrl(imageId: number) {
    return `${API_BASE}/images/${imageId}/raw`;
  }

  async setImagePrimary(imageId: number) {
    return this.request<{ id: number; isPrimary: boolean }>(`/images/${imageId}/primary`, {
      method: 'PATCH',
    });
  }

  async deleteImage(imageId: number) {
    return this.request<{ deleted: boolean }>(`/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  async getPrimaryImages(partIds: number[]) {
    return this.request<{ id: number; partId: number; filename: string; mimeType: string }[]>('/images/primary-bulk', {
      method: 'POST',
      body: JSON.stringify({ partIds }),
    });
  }

  // ============================================
  // Notifications
  // ============================================

  async getNotifications(limit?: number, unreadOnly?: boolean) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (unreadOnly) params.set('unread', 'true');
    const query = params.toString() ? `?${params}` : '';
    return this.request<Notification[]>(`/notifications${query}`);
  }

  async getNotificationCount() {
    return this.request<{ count: number }>('/notifications/count');
  }

  async markNotificationRead(id: number) {
    return this.request<{ read: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ marked: number }>('/notifications/read-all', {
      method: 'POST',
    });
  }
}

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'fulfillment' | 'viewer';
}

export type PartCondition = 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CORE' | 'SALVAGE' | 'UNKNOWN';

export const PART_CONDITIONS: { value: PartCondition; label: string; color: string }[] = [
  { value: 'NEW', label: 'New', color: 'emerald' },
  { value: 'EXCELLENT', label: 'Excellent', color: 'green' },
  { value: 'GOOD', label: 'Good', color: 'blue' },
  { value: 'FAIR', label: 'Fair', color: 'amber' },
  { value: 'POOR', label: 'Poor', color: 'orange' },
  { value: 'CORE', label: 'Core', color: 'purple' },
  { value: 'SALVAGE', label: 'Salvage', color: 'red' },
  { value: 'UNKNOWN', label: 'Unknown', color: 'slate' },
];

export interface Part {
  id: number;
  sku: string;
  name: string;
  description?: string;
  condition: PartCondition;
  minStock: number;
  costCents?: number | null;
  barcodeData?: string;
  skuDecoded?: string;
  fitments?: PartFitment[];
  interchangeMembers?: InterchangeGroupMember[];
  images?: PartImage[];
}

export interface PartImage {
  id: number;
  filename: string;
  mimeType: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface PartImageFull extends PartImage {
  partId: number;
  data: string; // Base64 encoded
}

export interface Vehicle {
  id: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
}

export interface PartFitment {
  id: number;
  partId: number;
  vehicleId: number;
  vehicle?: Vehicle;
  part?: Part;
}

export interface InterchangeGroup {
  id: number;
  name: string;
  description?: string;
  members?: InterchangeGroupMember[];
}

export interface InterchangeGroupMember {
  id: number;
  groupId: number;
  partId: number;
  group?: InterchangeGroup;
  part?: Part;
}

export interface Location {
  id: number;
  name: string;
}

export interface InventoryEvent {
  id: number;
  type: 'RECEIVE' | 'FULFILL' | 'RETURN' | 'CORRECTION';
  qtyDelta: number;
  partId: number;
  locationId: number;
  reason?: string;
  createdAt: string;
  part?: Part;
  location?: Location;
  user?: { id: number; name: string };
}

export interface OnHand {
  partId: number;
  locationId: number;
  quantity: number;
  part?: Part;
  location?: Location;
}

export interface Request {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'CANCELLED';
  notes?: string;
  items: RequestItem[];
  creator?: { id: number; name: string };
  createdAt: string;
  approvedAt?: string;
  fulfilledAt?: string;
}

export interface RequestItem {
  id: number;
  partId: number;
  qtyRequested: number;
  qtyFulfilled: number;
  locationId?: number;
  part?: Part;
  location?: Location;
}

export interface MakeCode {
  id: number;
  make: string;
  code: string;
}

export interface ModelCode {
  id: number;
  make: string;
  model: string;
  code: string;
}

export interface SystemCode {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface ComponentCode {
  id: number;
  systemCode: string;
  name: string;
  code: string;
}

export interface SkuGenerateResult {
  sku: string;
  decoded: {
    make: string;
    model: string;
    year: number;
    system: string;
    component: string;
    position: string | null;
  };
  barcode_png_base64: string;
}

export interface SkuLookupResult {
  sku: string;
  decoded: {
    make: string;
    model: string;
    year: number;
    system: string;
    component: string;
    position: string | null;
  };
  barcode_png_base64: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  userId: number;
  userName: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface RoleRequest {
  id: number;
  userId: number;
  requestedRole: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  reason?: string;
  createdAt: string;
  decidedAt?: string;
  user?: { id: number; email: string; name: string; role: string };
  decidedBy?: { id: number; name: string };
}

export interface UserWithCreator extends User {
  loginBarcode?: string;
  createdAt: string;
  createdBy?: { id: number; name: string };
}

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'LOW_STOCK' | 'REQUEST_APPROVED' | 'REQUEST_DENIED' | 'ROLE_APPROVED' | 'ROLE_DENIED';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export const api = new ApiClient();
