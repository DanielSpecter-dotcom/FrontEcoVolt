import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-verificar-codigo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verificar-codigo.html',
  styleUrl: './verificar-codigo.css',
})
export class VerificarCodigo implements OnInit {
  email = '';
  code = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || localStorage.getItem('pendingVerificationEmail') || '';
    });
  }

  onSubmit() {
    if (!this.email.trim()) {
      this.errorMessage = 'Ingresa el correo con el que creaste tu cuenta.';
      return;
    }

    if (this.code.trim().length !== 6 || isNaN(Number(this.code))) {
      this.errorMessage = 'El codigo debe tener exactamente 6 digitos numericos.';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    this.authService.verifyEmail(this.email.trim(), this.code.trim()).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success) {
          localStorage.removeItem('pendingVerificationEmail');
          this.successMessage = 'Cuenta verificada con exito. Redirigiendo al inicio de sesion...';
          setTimeout(() => this.router.navigate(['/login']), 3000);
          return;
        }

        this.errorMessage = response.message || 'El codigo ingresado es incorrecto o ha expirado.';
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error de verificacion:', err);

        if (err.status === 0) {
          localStorage.removeItem('pendingVerificationEmail');
          this.successMessage = 'Codigo verificado con exito (simulado - modo desarrollo). Redirigiendo al login...';
          setTimeout(() => this.router.navigate(['/login']), 2500);
          return;
        }

        this.errorMessage = err.error?.message || 'Error de conexion con el servidor. Verifica que el backend este ejecutandose.';
      }
    });
  }

  resendCode() {
    if (!this.email.trim()) {
      this.errorMessage = 'Ingresa tu correo para reenviar el codigo.';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    this.authService.resendVerification(this.email.trim()).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success) {
          localStorage.setItem('pendingVerificationEmail', this.email.trim());
          this.successMessage = 'Se ha enviado un nuevo codigo de 6 digitos a tu correo.';
          return;
        }

        this.errorMessage = response.message || 'No se pudo reenviar el codigo.';
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al reenviar codigo:', err);

        if (err.status === 0) {
          localStorage.setItem('pendingVerificationEmail', this.email.trim());
          this.successMessage = 'Codigo reenviado con exito (simulado - modo desarrollo).';
          return;
        }

        this.errorMessage = err.error?.message || 'Error de conexion con el servidor.';
      }
    });
  }
}
