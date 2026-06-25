import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * HTTP Interceptor that:
 * 1. Injects Authorization: Bearer {token} on all /api/ requests (except /api/v1/auth/*)
 * 2. On 401 responses, clears session and redirects to /login
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for public endpoints
  const isAuthEndpoint = req.url.includes('/api/v1/auth/');

  if (!isAuthEndpoint) {
    const token = authService.getToken();
    if (token && !authService.isTokenExpired()) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/api/v1/auth/')) {
        // Token expired or invalid — clear session and redirect
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
