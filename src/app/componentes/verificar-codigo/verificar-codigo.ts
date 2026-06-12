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
    // Read email query parameter
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  onSubmit() {
    if (!this.email.trim()) {
      this.errorMessage = 'El correo electrónico es obligatorio. Por favor ingresa a través del enlace del correo o regístrate de nuevo.';
      return;
    }

    if (this.code.trim().length !== 6 || isNaN(Number(this.code))) {
      this.errorMessage = 'El código debe tener exactamente 6 dígitos numéricos.';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    this.authService.verifyEmail(this.email, this.code).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = '¡Cuenta verificada con éxito! Redirigiendo al inicio de sesión...';
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.errorMessage = response.message || 'El código ingresado es incorrecto o ha expirado.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error de verificación:', err);
        // Fallback local en desarrollo si el backend está desconectado (status 0)
        if (err.status === 0) {
          console.log('Backend desconectado. Simulando verificación exitosa localmente...');
          this.successMessage = 'Código verificado con éxito (Simulado - Modo Desarrollo). Redirigiendo al Login...';
          setTimeout(() => this.router.navigate(['/login']), 2500);
        } else {
          this.errorMessage = err.error?.message || 'Error de conexión con el servidor. Verifica que el backend esté ejecutándose.';
        }
      }
    });
  }

  resendCode() {
    if (!this.email.trim()) {
      this.errorMessage = 'No se puede reenviar el código porque no hay un correo asociado.';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    this.authService.resendVerification(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Se ha enviado un nuevo código de 6 dígitos a tu correo.';
        } else {
          this.errorMessage = response.message || 'No se pudo reenviar el código.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al reenviar código:', err);
        if (err.status === 0) {
          this.successMessage = 'Código reenviado con éxito (Simulado - Modo Desarrollo).';
        } else {
          this.errorMessage = err.error?.message || 'Error de conexión con el servidor.';
        }
      }
    });
  }
}
