import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard = () => {
  const isAuthenticated = inject(AuthService).isAuthenticated();
  if (isAuthenticated) return true;

  inject(Router).navigate(["/admin/login"]);
  return false;
};
