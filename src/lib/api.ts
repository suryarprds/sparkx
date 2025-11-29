// API client for SparkX backend

const API_BASE_URL = '/api';

// Generic fetch wrapper
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Robot API
export const robotAPI = {
  // Get all robots with optional filters
  getAll: (params?: {
    status?: string;
    country?: string;
    region?: string;
    location?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.country) queryParams.append('country', params.country);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.location) queryParams.append('location', params.location);
    
    const query = queryParams.toString();
    return fetchAPI<any[]>(`/robots${query ? `?${query}` : ''}`);
  },

  // Get single robot by ID
  getById: (id: string) => fetchAPI<any>(`/robots/${id}`),

  // Get robot telemetry
  getTelemetry: (id: string, params?: { limit?: number; hours?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.hours) queryParams.append('hours', params.hours.toString());
    
    const query = queryParams.toString();
    return fetchAPI<any[]>(`/robots/${id}/telemetry${query ? `?${query}` : ''}`);
  },

  // Get robot sensors
  getSensors: (id: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return fetchAPI<any[]>(`/robots/${id}/sensors${query}`);
  },

  // Get robot diagnostics
  getDiagnostics: (id: string) => fetchAPI<any[]>(`/robots/${id}/diagnostics`),

  // Get network handoffs
  getNetworkHandoffs: (id: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return fetchAPI<any[]>(`/robots/${id}/network-handoffs${query}`);
  },

  // Get battery health history
  getBatteryHealthHistory: (id: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return fetchAPI<any[]>(`/robots/${id}/battery-health-history${query}`);
  },

  // Get charge history
  getChargeHistory: (id: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return fetchAPI<any[]>(`/robots/${id}/charge-history${query}`);
  },

  // Get component health
  getComponentHealth: (id: string) => fetchAPI<any[]>(`/robots/${id}/component-health`),

  // Get predictive alerts
  getPredictiveAlerts: (id: string) => fetchAPI<any[]>(`/robots/${id}/predictive-alerts`),
};

// Alert API
export const alertAPI = {
  // Get all alerts
  getAll: (params?: {
    severity?: string;
    robotId?: string;
    resolved?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.robotId) queryParams.append('robotId', params.robotId);
    if (params?.resolved !== undefined) queryParams.append('resolved', params.resolved.toString());
    
    const query = queryParams.toString();
    return fetchAPI<any[]>(`/alerts${query ? `?${query}` : ''}`);
  },

  // Acknowledge alert
  acknowledge: (id: number, acknowledgedBy?: string) =>
    fetchAPI<any>(`/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ acknowledgedBy }),
    }),

  // Resolve alert
  resolve: (id: number, resolvedBy?: string, resolutionNotes?: string) =>
    fetchAPI<any>(`/alerts/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolvedBy, resolutionNotes }),
    }),
};

// Maintenance API
export const maintenanceAPI = {
  // Get maintenance schedules
  getAll: (params?: { robotId?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.robotId) queryParams.append('robotId', params.robotId);
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return fetchAPI<any[]>(`/maintenance${query ? `?${query}` : ''}`);
  },
};

// Statistics API
export const statsAPI = {
  // Get fleet statistics
  getFleetStats: () => fetchAPI<any>('/stats/fleet'),
};

// Analytics API
export const analyticsAPI = {
  // Get battery trends (last 24 hours)
  getBatteryTrends: () => fetchAPI<Array<{
    time: string;
    avgBattery: number;
    minBattery: number;
    maxBattery: number;
  }>>('/analytics/battery-trends'),

  // Get temperature trends (last 24 hours)
  getTemperatureTrends: () => fetchAPI<Array<{
    time: string;
    avgTemp: number;
    maxTemp: number;
  }>>('/analytics/temperature-trends'),
};
