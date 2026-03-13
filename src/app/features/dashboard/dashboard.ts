import { Component, inject, signal, effect, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../core/services/api.service";
import { SignalRService } from "../../core/services/signalr.service";
import { EndpointSummaryDto, DashboardSummaryDto, EndpointStatus } from "../../core/models/api.models";
import { getStatusDisplay } from "../../shared/utils/status.helpers";
import { TimeAgoPipe } from "../../shared/pipes/time-ago.pipe";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { CardModule } from "primeng/card";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [TimeAgoPipe, ProgressSpinnerModule, CardModule],
  templateUrl: "./dashboard.html",
  styleUrl: "./dashboard.css"
})
export class Dashboard implements OnInit {
  private readonly api     = inject(ApiService);
  private readonly signalR = inject(SignalRService);

  // All local state is held as signals so Angular knows exactly which parts
  // of the template to update when data changes.
  readonly summary   = signal<DashboardSummaryDto | null>(null);
  readonly endpoints = signal<EndpointSummaryDto[]>([]);
  readonly isLoading = signal(true);
  readonly error     = signal<string | null>(null);

  // Expose the helper so the template can call it directly.
  readonly getStatusDisplay = getStatusDisplay;
  readonly EndpointStatus   = EndpointStatus;

  constructor() {
    // effect() runs whenever a signal it reads changes. Here we watch
    // lastCheckResult — every time the SignalR service receives a new check
    // result from the server, this effect fires and patches the matching
    // endpoint in our local array without a full re-fetch from the API.
    effect(() => {
      const result = this.signalR.lastCheckResult();
      if (!result) return;

      this.endpoints.update(current =>
        current.map(e =>
          e.id === result.endpointId
            ? {
                ...e,
                currentStatus:     result.currentStatus,
                lastResponseTimeMs: result.responseTimeMs,
                lastCheckedAt:     result.checkedAt
              }
            : e
        )
      );
    });

    // A second effect watches status changes specifically. The OnStatusChanged
    // event fires only on transitions (Unknown->Up, Up->Down etc), which is a
    // subset of OnCheckResult events. We use it to trigger the status badge
    // transition animation by updating currentStatus directly.
    effect(() => {
      const change = this.signalR.lastStatusChanged();
      if (!change) return;

      this.endpoints.update(current =>
        current.map(e =>
          e.id === change.endpointId
            ? { ...e, currentStatus: change.newStatus }
            : e
        )
      );
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const summary = await firstValueFrom(this.api.getDashboardSummary());
      this.summary.set(summary);
      this.endpoints.set([...summary.endpoints]);
      this.isLoading.set(false);

      // Connect to SignalR after the initial data is loaded so the user
      // sees content immediately rather than waiting for the hub handshake.
      await this.signalR.connect();
    } catch {
      this.error.set("Failed to load dashboard. Is the API running?");
      this.isLoading.set(false);
    }
  }
}
