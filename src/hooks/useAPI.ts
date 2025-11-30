// React Query hooks for API calls
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { robotAPI, alertAPI, maintenanceAPI, statsAPI, analyticsAPI } from '@/lib/api';

// Query keys
export const queryKeys = {
  robots: ['robots'] as const,
  robot: (id: string) => ['robots', id] as const,
  robotTelemetry: (id: string) => ['robots', id, 'telemetry'] as const,
  robotSensors: (id: string) => ['robots', id, 'sensors'] as const,
  robotDiagnostics: (id: string) => ['robots', id, 'diagnostics'] as const,
  networkHandoffs: (id: string) => ['robots', id, 'network-handoffs'] as const,
  batteryHealthHistory: (id: string) => ['robots', id, 'battery-health-history'] as const,
  chargeHistory: (id: string) => ['robots', id, 'charge-history'] as const,
  componentHealth: (id: string) => ['robots', id, 'component-health'] as const,
  predictiveAlerts: (id: string) => ['robots', id, 'predictive-alerts'] as const,
  alerts: ['alerts'] as const,
  maintenance: ['maintenance'] as const,
  fleetStats: ['stats', 'fleet'] as const,
  batteryTrends: ['analytics', 'battery-trends'] as const,
  temperatureTrends: ['analytics', 'temperature-trends'] as const,
};

// Robot hooks
export function useRobots(params?: {
  status?: string;
  country?: string;
  region?: string;
  location?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.robots, params],
    queryFn: async () => {
      const data = await robotAPI.getAll(params);
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: 3,
  });
}

export function useRobot(id: string) {
  return useQuery({
    queryKey: queryKeys.robot(id),
    queryFn: () => robotAPI.getById(id),
    enabled: !!id,
    refetchInterval: 3000, // Refetch every 3 seconds
  });
}

export function useRobotTelemetry(id: string, params?: { limit?: number; hours?: number }) {
  return useQuery({
    queryKey: [...queryKeys.robotTelemetry(id), params],
    queryFn: () => robotAPI.getTelemetry(id, params),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useRobotSensors(id: string, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.robotSensors(id), limit],
    queryFn: () => robotAPI.getSensors(id, limit),
    enabled: !!id,
  });
}

export function useRobotDiagnostics(id: string) {
  return useQuery({
    queryKey: queryKeys.robotDiagnostics(id),
    queryFn: () => robotAPI.getDiagnostics(id),
    enabled: !!id,
  });
}

export function useNetworkHandoffs(id: string, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.networkHandoffs(id), limit],
    queryFn: () => robotAPI.getNetworkHandoffs(id, limit),
    enabled: !!id,
  });
}

export function useBatteryHealthHistory(id: string, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.batteryHealthHistory(id), limit],
    queryFn: () => robotAPI.getBatteryHealthHistory(id, limit),
    enabled: !!id,
  });
}

export function useChargeHistory(id: string, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.chargeHistory(id), limit],
    queryFn: () => robotAPI.getChargeHistory(id, limit),
    enabled: !!id,
  });
}

export function useComponentHealth(id: string) {
  return useQuery({
    queryKey: queryKeys.componentHealth(id),
    queryFn: () => robotAPI.getComponentHealth(id),
    enabled: !!id,
  });
}

export function usePredictiveAlerts(id: string) {
  return useQuery({
    queryKey: queryKeys.predictiveAlerts(id),
    queryFn: () => robotAPI.getPredictiveAlerts(id),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Task hooks
export function useRobotTasks(id: string, status?: string) {
  return useQuery({
    queryKey: ['robots', id, 'tasks', status],
    queryFn: () => robotAPI.getTasks(id, status),
    enabled: !!id,
    refetchInterval: 5000, // Refetch every 5 seconds for task updates
  });
}

export function useCurrentTask(id: string) {
  return useQuery({
    queryKey: ['robots', id, 'tasks', 'current'],
    queryFn: () => robotAPI.getCurrentTask(id),
    enabled: !!id,
    refetchInterval: 3000, // Refetch every 3 seconds
  });
}

export function usePendingTasks(id: string) {
  return useQuery({
    queryKey: ['robots', id, 'tasks', 'pending'],
    queryFn: () => robotAPI.getPendingTasks(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useTaskHistory(id: string, limit?: number) {
  return useQuery({
    queryKey: ['robots', id, 'tasks', 'history', limit],
    queryFn: () => robotAPI.getTaskHistory(id, limit),
    enabled: !!id,
  });
}

// Alert hooks
export function useAlerts(params?: {
  severity?: string;
  robotId?: string;
  resolved?: boolean;
}) {
  return useQuery({
    queryKey: [...queryKeys.alerts, params],
    queryFn: () => alertAPI.getAll(params),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, acknowledgedBy }: { id: number; acknowledgedBy?: string }) =>
      alertAPI.acknowledge(id, acknowledgedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      resolvedBy, 
      resolutionNotes 
    }: { 
      id: number; 
      resolvedBy?: string; 
      resolutionNotes?: string;
    }) => alertAPI.resolve(id, resolvedBy, resolutionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

// Maintenance hooks
export function useMaintenance(params?: { robotId?: string; status?: string }) {
  return useQuery({
    queryKey: [...queryKeys.maintenance, params],
    queryFn: () => maintenanceAPI.getAll(params),
  });
}

// Statistics hooks
export function useFleetStats() {
  return useQuery({
    queryKey: queryKeys.fleetStats,
    queryFn: () => statsAPI.getFleetStats(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

// Analytics hooks
export function useBatteryTrends(params?: { region?: string; country?: string }) {
  return useQuery({
    queryKey: [...queryKeys.batteryTrends, params],
    queryFn: () => analyticsAPI.getBatteryTrends(params),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useTemperatureTrends(params?: { region?: string; country?: string }) {
  return useQuery({
    queryKey: [...queryKeys.temperatureTrends, params],
    queryFn: () => analyticsAPI.getTemperatureTrends(params),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useUptimeTrends() {
  return useQuery({
    queryKey: ['analytics', 'uptime-trends'],
    queryFn: () => analyticsAPI.getUptimeTrends(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useActiveIdleTrends(params?: { region?: string; country?: string }) {
  return useQuery({
    queryKey: ['analytics', 'active-idle-trends', params],
    queryFn: () => analyticsAPI.getActiveIdleTrends(params),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useAlertTrends() {
  return useQuery({
    queryKey: ['analytics', 'alert-trends'],
    queryFn: () => analyticsAPI.getAlertTrends(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useSensorHealth() {
  return useQuery({
    queryKey: ['analytics', 'sensor-health'],
    queryFn: () => analyticsAPI.getSensorHealth(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useFirmwareDistribution() {
  return useQuery({
    queryKey: ['analytics', 'firmware-distribution'],
    queryFn: () => analyticsAPI.getFirmwareDistribution(),
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 120000,
  });
}

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: ['analytics', 'maintenance-status'],
    queryFn: () => analyticsAPI.getMaintenanceStatus(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useNetworkLatency() {
  return useQuery({
    queryKey: ['analytics', 'network-latency'],
    queryFn: () => analyticsAPI.getNetworkLatency(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useDataIngestion() {
  return useQuery({
    queryKey: ['analytics', 'data-ingestion'],
    queryFn: () => analyticsAPI.getDataIngestion(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000,
  });
}

export function useTaskCompletion(params?: { region?: string; country?: string }) {
  return useQuery({
    queryKey: ['analytics', 'task-completion', params],
    queryFn: () => analyticsAPI.getTaskCompletion(params),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useResourceUsage() {
  return useQuery({
    queryKey: ['analytics', 'resource-usage'],
    queryFn: () => analyticsAPI.getResourceUsage(),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useFleetSummary() {
  return useQuery({
    queryKey: ['analytics', 'fleet-summary'],
    queryFn: () => analyticsAPI.getFleetSummary(),
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
    staleTime: 5000,
  });
}

export function useRobotMapLocations() {
  return useQuery({
    queryKey: ['analytics', 'robot-map-locations'],
    queryFn: () => analyticsAPI.getRobotMapLocations(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });
}

// Robot position update mutation
export function useUpdateRobotPosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      latitude, 
      longitude, 
      heading 
    }: { 
      id: string; 
      latitude: number; 
      longitude: number; 
      heading?: number;
    }) => robotAPI.updatePosition(id, { latitude, longitude, heading }),
    onSuccess: (_, variables) => {
      // Invalidate robot and telemetry queries to refetch updated position
      queryClient.invalidateQueries({ queryKey: queryKeys.robot(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.robotTelemetry(variables.id) });
    },
  });
}

