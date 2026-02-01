const API_BASE = '/api';

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
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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

  async me() {
    return this.request<User>('/auth/me');
  }

  // Parts
  async getParts(search?: string) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{ parts: Part[]; pagination: Pagination }>(`/parts${params}`);
  }

  async createPart(sku: string, name: string, description?: string) {
    return this.request<Part>('/parts', {
      method: 'POST',
      body: JSON.stringify({ sku, name, description }),
    });
  }

  async getPartById(id: number) {
    return this.request<Part>(`/parts/${id}`);
  }

  async addFitment(partId: number, vehicleId: number) {
    return this.request<PartFitment>(`/parts/${partId}/fitments`, {
      method: 'POST',
      body: JSON.stringify({ vehicleId }),
    });
  }

  // Vehicles
  async getVehicles(search?: string) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{ vehicles: Vehicle[]; pagination: Pagination }>(`/vehicles${params}`);
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
}

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'fulfillment' | 'viewer';
}

export interface Part {
  id: number;
  sku: string;
  name: string;
  description?: string;
  barcodeData?: string;
  skuDecoded?: string;
  fitments?: PartFitment[];
  interchangeMembers?: InterchangeGroupMember[];
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

export const api = new ApiClient();
