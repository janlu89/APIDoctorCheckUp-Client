import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { Shell } from "./layout/shell/shell";

export const routes: Routes = [
  {
    path: "",
    component: Shell,
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./features/dashboard/dashboard").then(m => m.Dashboard)
      },
      {
        path: "endpoints/:id",
        loadComponent: () =>
          import("./features/endpoint-detail/endpoint-detail").then(m => m.EndpointDetail)
      },
      {
        path: "admin/login",
        loadComponent: () =>
          import("./features/admin/login/login").then(m => m.Login)
      },
      {
        path: "admin/endpoints",
        canActivate: [authGuard],
        loadComponent: () =>
          import("./features/admin/endpoints/admin-endpoints").then(m => m.AdminEndpoints)
      }
    ]
  },
  { path: "**", redirectTo: "" }
];
