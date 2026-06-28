import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  selectedAccountType: 'personal' | 'enterprise' = 'personal';
  isPasswordVisible = false;
  isLoading = false;

  email = '';
  password = '';
  dni = '';
  nombreEmpresa = '';
  ruc = '';
  acceptTerms = false;

  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  setAccountType(type: 'personal' | 'enterprise') {
    this.selectedAccountType = type;
    this.errorMessage = null;
    this.successMessage = null;
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmit() {
    if (this.isLoading) {
      return;
    }

    if (!this.email.trim() || !this.password.trim() || !this.dni.trim()) {
      this.errorMessage = 'Por favor complete los campos obligatorios.';
      return;
    }

    if (!this.acceptTerms) {
      this.errorMessage = 'Debe aceptar los Términos de servicio y la Política de privacidad.';
      return;
    }

    if (this.dni.trim().length !== 8) {
      this.errorMessage = 'El DNI debe tener exactamente 8 digitos.';
      return;
    }

    if (this.selectedAccountType === 'enterprise') {
      if (!this.nombreEmpresa.trim() || !this.ruc.trim()) {
        this.errorMessage = 'Por favor complete el nombre de la empresa y el RUC.';
        return;
      }

      if (this.ruc.trim().length !== 11) {
        this.errorMessage = 'El RUC debe tener exactamente 11 digitos.';
        return;
      }
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    const request$ = this.selectedAccountType === 'personal'
      ? this.authService.registerPersonal(this.dni.trim(), this.email.trim(), this.password)
      : this.authService.registerEnterprise(
          this.dni.trim(),
          this.email.trim(),
          this.password,
          this.nombreEmpresa.trim(),
          this.ruc.trim()
        );

    request$.subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success) {
          this.successMessage = this.selectedAccountType === 'personal'
            ? 'Registro exitoso. Redirigiendo a verificacion de codigo...'
            : 'Registro empresarial exitoso. Redirigiendo a verificacion de codigo...';
          this.goToVerification();
          return;
        }

        this.errorMessage = response.message || 'Error al registrar la cuenta.';
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al registrar usuario:', err);

        if (err.status === 0) {
          this.successMessage = 'Registro exitoso (simulado - modo desarrollo). Redirigiendo a verificacion...';
          this.goToVerification();
          return;
        }

        this.errorMessage = err.error?.message || 'Error de conexion con el servidor. Verifica que el backend este ejecutandose.';
      }
    });
  }

  private goToVerification() {
    const email = this.email.trim();
    localStorage.setItem('pendingVerificationEmail', email);
    setTimeout(() => this.router.navigate(['/verificar-codigo'], { queryParams: { email } }), 2000);
  }
}
