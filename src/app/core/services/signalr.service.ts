import { Injectable, signal } from "@angular/core";
import * as signalR from "@microsoft/signalr";
import { environment } from "../../../environments/environment";

export interface CheckResultBroadcast {
  endpointId: number;
  endpointName: string;
  checkedAt: string;
  statusCode: number | null;
  responseTimeMs: number;
  isSuccess: boolean;
  errorMessage: string | null;
  currentStatus: number;
}

export interface StatusChangedBroadcast {
  endpointId: number;
  endpointName: string;
  previousStatus: number;
  newStatus: number;
  changedAt: string;
}

@Injectable({ providedIn: "root" })
export class SignalRService {
  private connection: signalR.HubConnection | null = null;

  readonly lastCheckResult   = signal<CheckResultBroadcast | null>(null);
  readonly lastStatusChanged = signal<StatusChangedBroadcast | null>(null);
  readonly isConnected       = signal(false);

  async connect(): Promise<void> {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl)
      .withAutomaticReconnect()
      .build();

    this.connection.on("OnCheckResult",    (payload: CheckResultBroadcast) =>
      this.lastCheckResult.set(payload));

    this.connection.on("OnStatusChanged",  (payload: StatusChangedBroadcast) =>
      this.lastStatusChanged.set(payload));

    this.connection.onreconnected(() => this.isConnected.set(true));
    this.connection.onclose(()      => this.isConnected.set(false));

    await this.connection.start();
    await this.connection.invoke("JoinDashboard");
    this.isConnected.set(true);
  }

  async disconnect(): Promise<void> {
    await this.connection?.stop();
    this.connection = null;
    this.isConnected.set(false);
  }
}
