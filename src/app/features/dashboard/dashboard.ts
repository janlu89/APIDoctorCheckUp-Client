import { Component, inject, signal, effect, OnInit, OnDestroy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../core/services/api.service";
import { SignalRService } from "../../core/services/signalr.service";
import {
  EndpointSummaryDto,
  DashboardSummaryDto,
  EndpointStatus
} from "../../core/models/api.models";
import { getStatusDisplay } from "../../shared/utils/status.helpers";
import { TimeAgoPipe } from "../../shared/pipes/time-ago.pipe";
import { ProgressSpinnerModule } from "primeng/progressspinner";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [RouterLink, TimeAgoPipe, ProgressSpinnerModule],
  templateUrl: "./dashboard.html",
  styleUrl: "./dashboard.css"
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly api     = inject(ApiService);
  protected readonly signalR = inject(SignalRService);

  readonly summary   = signal<DashboardSummaryDto | null>(null);
  readonly endpoints = signal<EndpointSummaryDto[]>([]);
  readonly isLoading = signal(true);
  readonly error     = signal<string | null>(null);

  readonly getStatusDisplay = getStatusDisplay;
  readonly EndpointStatus   = EndpointStatus;

  constructor() {
    effect(() => {
      const result = this.signalR.lastCheckResult();
      if (!result) return;

      this.endpoints.update(current =>
        current.map(e =>
          e.id === result.endpointId
            ? {
                ...e,
                currentStatus:      result.currentStatus,
                lastResponseTimeMs: result.responseTimeMs,
                lastCheckedAt:      result.checkedAt
              }
            : e
        )
      );
    });

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
      await this.signalR.connect();
    } catch {
      this.error.set("Failed to load dashboard. Is the API running?");
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    // We do NOT disconnect SignalR here intentionally. The connection is a
    // singleton service shared across the whole app — disconnecting when the
    // dashboard unmounts would break the endpoint detail page which also needs
    // the live stream. The connection stays alive for the application lifetime.
    // What we rely on instead is that Angular destroys the component's effects
    // automatically when the component is destroyed, so this component's signal
    // watchers stop firing even though the underlying connection remains open.
  }
}
