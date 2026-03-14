import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import {
  DashboardSummaryDto,
  EndpointDto,
  CheckResultDto,
  EndpointStatsDto,
  CreateEndpointDto,
  UpdateEndpointDto
} from "../models/api.models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // -- Dashboard ------------------------------------------------------------
  getDashboardSummary() {
    return this.http.get<DashboardSummaryDto>(`${this.base}/api/dashboard/summary`);
  }

  // -- Endpoints ------------------------------------------------------------
  getEndpoints() {
    return this.http.get<EndpointDto[]>(`${this.base}/api/endpoints`);
  }

  getEndpoint(id: number) {
    return this.http.get<EndpointDto>(`${this.base}/api/endpoints/${id}`);
  }

  getEndpointChecks(id: number, limit = 50) {
    return this.http.get<CheckResultDto[]>(
      `${this.base}/api/endpoints/${id}/checks?limit=${limit}`
    );
  }

  getEndpointStats(id: number) {
    return this.http.get<EndpointStatsDto>(`${this.base}/api/endpoints/${id}/stats`);
  }

  createEndpoint(dto: CreateEndpointDto) {
    return this.http.post<EndpointDto>(`${this.base}/api/endpoints`, dto);
  }

  updateEndpoint(id: number, dto: UpdateEndpointDto) {
    return this.http.put<EndpointDto>(`${this.base}/api/endpoints/${id}`, dto);
  }

  deleteEndpoint(id: number) {
    return this.http.delete<void>(`${this.base}/api/endpoints/${id}`);
  }
}
