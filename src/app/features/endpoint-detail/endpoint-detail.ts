import { Component, inject, signal, effect, input, OnInit, OnDestroy, computed } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DecimalPipe } from "@angular/common";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../core/services/api.service";
import { SignalRService } from "../../core/services/signalr.service";
import {
  EndpointDto,
  CheckResultDto,
  EndpointStatsDto,
  EndpointStatus
} from "../../core/models/api.models";
import { getStatusDisplay } from "../../shared/utils/status.helpers";
import { TimeAgoPipe } from "../../shared/pipes/time-ago.pipe";
import { ChartModule } from "primeng/chart";

@Component({
  selector: "app-endpoint-detail",
  standalone: true,
  imports: [RouterLink, DecimalPipe, TimeAgoPipe, ChartModule],
  templateUrl: "./endpoint-detail.html",
  styleUrl: "./endpoint-detail.css"
})
export class EndpointDetail implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  private readonly api     = inject(ApiService);
  private readonly signalR = inject(SignalRService);

  readonly endpoint  = signal<EndpointDto | null>(null);
  readonly stats     = signal<EndpointStatsDto | null>(null);
  readonly checks    = signal<CheckResultDto[]>([]);
  readonly isLoading = signal(true);
  readonly error     = signal<string | null>(null);

  readonly chartData    = signal<object | null>(null);
  readonly chartOptions = this.buildChartOptions();

  readonly getStatusDisplay = getStatusDisplay;
  readonly EndpointStatus   = EndpointStatus;

  readonly uptimeClass = computed(() => {
    const u = this.stats()?.uptimeLast24Hours ?? 0;
    if (u >= 99) return "uptime--excellent";
    if (u >= 95) return "uptime--good";
    if (u >= 80) return "uptime--warning";
    return "uptime--critical";
  });

  constructor() {
    effect(() => {
      const result = this.signalR.lastCheckResult();

      // Do not process SignalR events while the initial data load is still
      // in progress. isLoading() being true means the signals for checks,
      // chartData, and endpoint have not been populated yet, and writing
      // to them here would race against the Promise.all in ngOnInit.
      if (!result || this.isLoading() || result.endpointId !== Number(this.id())) return;

      const newCheck: CheckResultDto = {
        id:             0,
        endpointId:     result.endpointId,
        checkedAt:      result.checkedAt,
        statusCode:     result.statusCode,
        responseTimeMs: result.responseTimeMs,
        isSuccess:      result.isSuccess,
        errorMessage:   result.errorMessage
      };

      this.checks.update(current => [newCheck, ...current].slice(0, 50));
      this.chartData.set(this.buildChartData(this.checks()));
      this.endpoint.update(e => e ? { ...e, currentStatus: result.currentStatus } : e);
    });

    effect(() => {
      const change = this.signalR.lastStatusChanged();
      if (!change || this.isLoading() || change.endpointId !== Number(this.id())) return;

      this.endpoint.update(e => e ? { ...e, currentStatus: change.newStatus } : e);
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const numId = Number(this.id());

      const [endpoint, checks, stats] = await Promise.all([
        firstValueFrom(this.api.getEndpoint(numId)),
        firstValueFrom(this.api.getEndpointChecks(numId, 50)),
        firstValueFrom(this.api.getEndpointStats(numId))
      ]);

      this.endpoint.set(endpoint);
      this.checks.set(checks);
      this.stats.set(stats);
      this.chartData.set(this.buildChartData(checks));

      // Set isLoading to false only after ALL signals are populated.
      // This is the gate that allows the SignalR effects above to start firing.
      this.isLoading.set(false);

      await this.signalR.connect();
    } catch {
      this.error.set("Failed to load endpoint details. Is the API running?");
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {}

  private buildChartData(checks: CheckResultDto[]): object {
    const chronological = [...checks].reverse();

    return {
      labels: chronological.map(c =>
        new Date(c.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      ),
      datasets: [
        {
          label:            "Response Time (ms)",
          data:             chronological.map(c => c.responseTimeMs),
          fill:             true,
          tension:          0.4,
          borderColor:      "#6366f1",
          backgroundColor:  "rgba(99, 102, 241, 0.1)",
          pointRadius:      3,
          pointHoverRadius: 6,
          borderWidth:      2
        }
      ]
    };
  }

  private buildChartOptions(): object {
    return {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: 300 },
      plugins: {
        legend:  { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed: { y: number } }) => ` ${ctx.parsed.y}ms`
          }
        }
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 10, maxRotation: 0 },
          grid:  { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v: number) => `${v}ms`
          }
        }
      }
    };
  }
}
