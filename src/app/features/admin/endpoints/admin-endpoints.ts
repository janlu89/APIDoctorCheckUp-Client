import { Component, inject, signal, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgTemplateOutlet } from "@angular/common";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";
import { EndpointDto, CreateEndpointDto, UpdateEndpointDto } from "../../../core/models/api.models";
import { getStatusDisplay } from "../../../shared/utils/status.helpers";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { MessageModule } from "primeng/message";
import { ConfirmationService } from "primeng/api";

@Component({
  selector: "app-admin-endpoints",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ConfirmDialogModule,
    MessageModule
  ],
  providers: [ConfirmationService],
  templateUrl: "./admin-endpoints.html",
  styleUrl: "./admin-endpoints.css"
})
export class AdminEndpoints implements OnInit {
  private readonly api        = inject(ApiService);
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);
  private readonly confirmSvc = inject(ConfirmationService);

  readonly endpoints  = signal<EndpointDto[]>([]);
  readonly isLoading  = signal(true);
  readonly isSaving   = signal(false);
  readonly error      = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  readonly editingId  = signal<number | null>(null);

  readonly getStatusDisplay = getStatusDisplay;

  readonly form = this.fb.group({
    name:                    ["", [Validators.required, Validators.maxLength(100)]],
    url:                     ["", [Validators.required, Validators.maxLength(2048)]],
    expectedStatusCode:      [200, [Validators.required, Validators.min(100), Validators.max(599)]],
    checkIntervalSeconds:    [60,  [Validators.required, Validators.min(30)]],
    responseTimeWarningMs:   [1000,[Validators.required, Validators.min(100)]],
    responseTimeCriticalMs:  [3000,[Validators.required, Validators.min(100)]],
    consecutiveFailuresDown: [3,   [Validators.required, Validators.min(1)]],
    isActive:                [true]
  });

  async ngOnInit(): Promise<void> {
    await this.loadEndpoints();
  }

  private async loadEndpoints(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getEndpoints());
      this.endpoints.set(data);
      this.isLoading.set(false);
    } catch {
      this.error.set("Failed to load endpoints.");
      this.isLoading.set(false);
    }
  }

  openCreate(): void {
    this.form.reset({
      name: "", url: "", expectedStatusCode: 200, checkIntervalSeconds: 60,
      responseTimeWarningMs: 1000, responseTimeCriticalMs: 3000,
      consecutiveFailuresDown: 3, isActive: true
    });
    this.editingId.set(0);
    this.clearMessages();
  }

  openEdit(endpoint: EndpointDto): void {
    this.form.patchValue({
      name:                    endpoint.name,
      url:                     endpoint.url,
      expectedStatusCode:      endpoint.expectedStatusCode,
      checkIntervalSeconds:    endpoint.checkIntervalSeconds,
      responseTimeWarningMs:   endpoint.alertThreshold?.responseTimeWarningMs  ?? 1000,
      responseTimeCriticalMs:  endpoint.alertThreshold?.responseTimeCriticalMs ?? 3000,
      consecutiveFailuresDown: endpoint.alertThreshold?.consecutiveFailuresDown ?? 3,
      isActive:                endpoint.isActive
    });
    this.editingId.set(endpoint.id);
    this.clearMessages();
  }

  closePanel(): void {
    this.editingId.set(null);
    this.clearMessages();
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    this.clearMessages();

    const raw = this.form.getRawValue();
    const id  = this.editingId();

    try {
      if (id === 0) {
        const dto: CreateEndpointDto = {
          name:                    raw.name!,
          url:                     raw.url!,
          expectedStatusCode:      raw.expectedStatusCode!,
          checkIntervalSeconds:    raw.checkIntervalSeconds!,
          responseTimeWarningMs:   raw.responseTimeWarningMs!,
          responseTimeCriticalMs:  raw.responseTimeCriticalMs!,
          consecutiveFailuresDown: raw.consecutiveFailuresDown!
        };
        const created = await firstValueFrom(this.api.createEndpoint(dto));
        this.endpoints.update(list => [...list, created]);
        this.successMsg.set(`Endpoint "${created.name}" created successfully.`);
      } else {
        const dto: UpdateEndpointDto = {
          name:                    raw.name!,
          url:                     raw.url!,
          expectedStatusCode:      raw.expectedStatusCode!,
          checkIntervalSeconds:    raw.checkIntervalSeconds!,
          responseTimeWarningMs:   raw.responseTimeWarningMs!,
          responseTimeCriticalMs:  raw.responseTimeCriticalMs!,
          consecutiveFailuresDown: raw.consecutiveFailuresDown!,
          isActive:                raw.isActive!
        };
        const updated = await firstValueFrom(this.api.updateEndpoint(id!, dto));
        this.endpoints.update(list => list.map(e => e.id === updated.id ? updated : e));
        this.successMsg.set(`Endpoint "${updated.name}" updated successfully.`);
      }

      this.editingId.set(null);
    } catch {
      this.error.set("Failed to save endpoint. Check the form values and try again.");
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmDelete(endpoint: EndpointDto): void {
    this.confirmSvc.confirm({
      message: `Delete "${endpoint.name}"? This will remove all check history and incidents.`,
      header:  "Confirm Delete",
      icon:    "pi pi-exclamation-triangle",
      accept:  () => this.delete(endpoint.id)
    });
  }

  private async delete(id: number): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteEndpoint(id));
      this.endpoints.update(list => list.filter(e => e.id !== id));
      this.successMsg.set("Endpoint deleted successfully.");
      if (this.editingId() === id) this.editingId.set(null);
    } catch {
      this.error.set("Failed to delete endpoint.");
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(["/"]);
  }

  private clearMessages(): void {
    this.error.set(null);
    this.successMsg.set(null);
  }
}
