import { Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { AuthService } from "../../core/services/auth.service";
import { SignalRService } from "../../core/services/signalr.service";

@Component({
  selector: "app-topbar",
  standalone: true,
  imports: [ButtonModule, RouterLink],
  templateUrl: "./topbar.html",
  styleUrl: "./topbar.css"
})
export class Topbar {
  protected readonly auth     = inject(AuthService);
  protected readonly signalR  = inject(SignalRService);
  private   readonly router   = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(["/"]);
  }
}
