import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterResponse {
  correo: string;
  verification_token: string;
  expires_at: string;
  verification_link: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = '/api/v1/auth';

  constructor(private http: HttpClient) {}

  // Login
  login(correo: string, contrasena: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, {
      correo,
      contrasena
    }).pipe(
      tap((res) => {
        if (res.success && res.data?.token) {
          localStorage.setItem('ecovolt_token', res.data.token);
        }
      })
    );
  }

  // Register Personal Account
  registerPersonal(dni: string, correo: string, contrasena: string): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.baseUrl}/register`, {
      dni,
      correo,
      contrasena,
      tipo_uso: 'PERSONAL'
    });
  }

  // Register Enterprise Account
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

  // Verify Email with 6-digit Code
  verifyEmail(correo: string, codigo: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/verify-email`, {
      correo,
      codigo
    });
  }

  // Resend Verification Code
  resendVerification(correo: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/resend-verification`, {
      correo
    });
  }

  logout() {
    localStorage.removeItem('ecovolt_token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('ecovolt_token');
  }
}
