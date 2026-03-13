export enum EndpointStatus {
  Unknown  = 0,
  Up       = 1,
  Degraded = 2,
  Down     = 3
}

export interface AlertThresholdDto {
  id: number;
  responseTimeWarningMs: number;
  responseTimeCriticalMs: number;
  consecutiveFailuresDown: number;
}

export interface EndpointDto {
  id: number;
  name: string;
  url: string;
  expectedStatusCode: number;
  checkIntervalSeconds: number;
  isActive: boolean;
  createdAt: string;
  currentStatus: EndpointStatus;
  alertThreshold: AlertThresholdDto | null;
}

export interface EndpointSummaryDto {
  id: number;
  name: string;
  url: string;
  currentStatus: EndpointStatus;
  lastResponseTimeMs: number | null;
  lastCheckedAt: string | null;
  uptimeLast24Hours: number;
}

export interface DashboardSummaryDto {
  totalEndpoints: number;
  upCount: number;
  degradedCount: number;
  downCount: number;
  unknownCount: number;
  endpoints: EndpointSummaryDto[];
}

export interface CheckResultDto {
  id: number;
  endpointId: number;
  checkedAt: string;
  statusCode: number | null;
  responseTimeMs: number;
  isSuccess: boolean;
  errorMessage: string | null;
}

export interface EndpointStatsDto {
  endpointId: number;
  uptimeLast24Hours: number;
  uptimeLast7Days: number;
  uptimeLast30Days: number;
  averageResponseTimeMs: number;
  totalIncidents: number;
  openIncidents: number;
}

export interface CreateEndpointDto {
  name: string;
  url: string;
  expectedStatusCode: number;
  checkIntervalSeconds: number;
  responseTimeWarningMs: number;
  responseTimeCriticalMs: number;
  consecutiveFailuresDown: number;
}

export interface UpdateEndpointDto extends CreateEndpointDto {
  isActive: boolean;
}
