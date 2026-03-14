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

  // These signals hold the most recent broadcast payloads.
  // Components read them via effect() to react to new data.
  readonly lastCheckResult   = signal<CheckResultBroadcast | null>(null);
  readonly lastStatusChanged = signal<StatusChangedBroadcast | null>(null);
  readonly isConnected       = signal(false);

  async connect(): Promise<void> {
    // If a connection already exists in any state, do not create another one.
    // The automatic reconnect policy handles recovery from transient failures.
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register event handlers exactly once at connection creation time.
    // These handlers write to signals, which Angular picks up via effect()
    // in whichever component is currently subscribed.
    this.connection.on("OnCheckResult", (payload: CheckResultBroadcast) =>
      this.lastCheckResult.set(payload)
    );

    this.connection.on("OnStatusChanged", (payload: StatusChangedBroadcast) =>
      this.lastStatusChanged.set(payload)
    );

    this.connection.onreconnecting(() => this.isConnected.set(false));
    this.connection.onreconnected(async () => {
      // After a reconnect, rejoin the dashboard group because group membership
      // is not preserved across connection drops.
      await this.connection?.invoke("JoinDashboard");
      this.isConnected.set(true);
    });
    this.connection.onclose(() => this.isConnected.set(false));

    await this.connection.start();
    await this.connection.invoke("JoinDashboard");
    this.isConnected.set(true);
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return;
    await this.connection.stop();
    this.connection = null;
    this.isConnected.set(false);
  }
}
