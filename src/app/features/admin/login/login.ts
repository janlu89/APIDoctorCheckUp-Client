import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule],
  templateUrl: "./login.html",
  styleUrl: "./login.css"
})
export class Login {
  private readonly auth    = inject(AuthService);
  private readonly router  = inject(Router);
  private readonly fb      = inject(FormBuilder);

  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);

  readonly form = this.fb.group({
    username: ["", Validators.required],
    password: ["", Validators.required]
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    const { username, password } = this.form.getRawValue();

    this.auth.login({ username: username!, password: password! }).subscribe({
      next: () => this.router.navigate(["/admin/endpoints"]),
      error: () => {
        this.error.set("Invalid username or password.");
        this.isLoading.set(false);
      }
    });
  }
}
