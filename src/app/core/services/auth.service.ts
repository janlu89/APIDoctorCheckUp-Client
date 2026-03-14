import { inject, Injectable, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { tap } from "rxjs";

interface LoginDto { username: string; password: string; }
interface TokenDto  { accessToken: string; expiresAt: string; }

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly token = this._token.asReadonly();

  login(dto: LoginDto) {
    return this.http
      .post<TokenDto>(`${environment.apiUrl}/api/auth/login`, dto)
      .pipe(tap(response => this._token.set(response.accessToken)));
  }

  logout() {
    this._token.set(null);
  }
}
