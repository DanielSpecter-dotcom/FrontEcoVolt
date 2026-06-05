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

  // Form Fields
  email = '';
  password = '';
  dni = '';
  nombreEmpresa = '';
  ruc = '';

  // Status Alerts
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
    if (!this.email.trim() || !this.password.trim() || !this.dni.trim()) {
      this.errorMessage = 'Por favor complete los campos obligatorios.';
      return;
    }

    if (this.dni.trim().length !== 8) {
      this.errorMessage = 'El DNI debe tener exactamente 8 dígitos.';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    if (this.selectedAccountType === 'personal') {
      this.authService.registerPersonal(this.dni, this.email, this.password).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Registro exitoso. Redirigiendo a verificación de código...';
            setTimeout(() => this.router.navigate(['/verificar-codigo'], { queryParams: { email: this.email } }), 2000);
          } else {
            this.errorMessage = response.message || 'Error al registrar la cuenta.';
          }
        },
        error: (err) => {
          console.error('Error al registrar usuario personal:', err);
          if (err.status === 0) {
            console.log('Backend desconectado. Simulando registro personal exitoso (Local)...');
            this.successMessage = 'Registro exitoso (Simulado - Modo Desarrollo). Redirigiendo a verificación...';
            setTimeout(() => this.router.navigate(['/verificar-codigo'], { queryParams: { email: this.email } }), 2000);
          } else {
            this.errorMessage = err.error?.message || 'Error de conexión con el servidor. Verifica que el backend esté ejecutándose.';
          }
        }
      });
    } else {
      if (!this.nombreEmpresa.trim() || !this.ruc.trim()) {
        this.errorMessage = 'Por favor complete el nombre de la empresa y el RUC.';
        return;
      }
      if (this.ruc.trim().length !== 11) {
        this.errorMessage = 'El RUC debe tener exactamente 11 dígitos.';
        return;
      }

      this.authService.registerEnterprise(this.dni, this.email, this.password, this.nombreEmpresa, this.ruc).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Registro empresarial exitoso. Redirigiendo a verificación de código...';
            setTimeout(() => this.router.navigate(['/verificar-codigo'], { queryParams: { email: this.email } }), 2000);
          } else {
            this.errorMessage = response.message || 'Error al registrar la cuenta empresarial.';
          }
        },
        error: (err) => {
          console.error('Error al registrar usuario empresarial:', err);
          if (err.status === 0) {
            console.log('Backend desconectado. Simulando registro empresarial exitoso (Local)...');
            this.successMessage = 'Registro empresarial exitoso (Simulado - Modo Desarrollo). Redirigiendo a verificación...';
            setTimeout(() => this.router.navigate(['/verificar-codigo'], { queryParams: { email: this.email } }), 2000);
          } else {
            this.errorMessage = err.error?.message || 'Error de conexión con el servidor. Verifica que el backend esté ejecutándose.';
          }
        }
      });
    }
  }
}

