import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, LoginResponse, RegisterResponse, JwtPayload } from '../modelos';

// Re-export types for backward compatibility
export type { ApiResponse, LoginResponse, RegisterResponse, JwtPayload };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = '/api/v1/auth';

  constructor(private http: HttpClient) {}

  // --- Auth API Calls ---

  login(correo: string, contrasena: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, {
      correo,
      contrasena
    }).pipe(
      tap((res) => {
        if (res.success && res.data?.token) {
          this.saveSession(res.data.token);
        }
      })
    );
  }

  registerPersonal(dni: string, correo: string, contrasena: string): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.baseUrl}/register`, {
      dni,
      correo,
      contrasena,
      tipo_uso: 'PERSONAL'
    });
  }

  registerEnterprise(dni: string, correo: string, contrasena: string, nombreEmpresa: string, ruc: string): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.baseUrl}/register`, {
      dni,
      correo,
      contrasena,
      tipo_uso: 'EMPRESARIAL',
      nombre_empresa: nombreEmpresa,
      ruc
    });
  }

  verifyEmail(correo: string, codigo: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/verify-email`, {
      correo,
      codigo
    });
  }

  resendVerification(correo: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/resend-verification`, {
      correo
    });
  }

  // --- Session Management ---

  private saveSession(token: string): void {
    localStorage.setItem('ecovolt_token', token);

    const payload = this.decodeToken(token);
    if (payload) {
      localStorage.setItem('ecovolt_user_email', payload.sub);
      // Store the primary role (e.g., "PERSONAL" from "ROLE_PERSONAL")
      const role = this.extractRoleFromAuthorities(payload.authorities);
      localStorage.setItem('ecovolt_user_role', role);
      // Keep backward compatibility
      localStorage.setItem('currentUserEmail', payload.sub);
    }
  }

  logout(): void {
    localStorage.removeItem('ecovolt_token');
    localStorage.removeItem('ecovolt_user_email');
    localStorage.removeItem('ecovolt_user_role');
    localStorage.removeItem('ecovolt_user_id');
    localStorage.removeItem('currentUserEmail');
  }

  // --- Token Helpers ---

  getToken(): string | null {
    return localStorage.getItem('ecovolt_token');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('ecovolt_user_email');
  }

  getUserRole(): string {
    return localStorage.getItem('ecovolt_user_role') || 'PERSONAL';
  }

  getUserId(): number | null {
    const id = localStorage.getItem('ecovolt_user_id');
    return id ? parseInt(id, 10) : null;
  }

  setUserId(id: number): void {
    localStorage.setItem('ecovolt_user_id', id.toString());
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;

    // exp is in seconds, Date.now() is in milliseconds
    const expirationMs = payload.exp * 1000;
    return Date.now() >= expirationMs;
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Decode the payload (second part)
      const payload = parts[1];
      // Handle base64url encoding (replace - with +, _ with /)
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload) as JwtPayload;
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return null;
    }
  }

  getTokenPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    return this.decodeToken(token);
  }

  private extractRoleFromAuthorities(authorities: string[]): string {
    if (!authorities || authorities.length === 0) return 'PERSONAL';
    // authorities come as ["ROLE_PERSONAL"] or ["ROLE_EMPRESARIAL"]
    const roleStr = authorities[0] || '';
    return roleStr.replace('ROLE_', '');
  }
}
