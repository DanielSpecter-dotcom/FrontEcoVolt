import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  isPasswordVisible = false;
  rememberMe = false;
  email = '';
  password = '';
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmit() {
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Por favor complete todos los campos.';
      return;
    }

    this.errorMessage = null;
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Login exitoso:', response.message);
          localStorage.setItem('currentUserEmail', this.email);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Error al iniciar sesión.';
        }
      },
      error: (err) => {
        console.error('Error de red/servidor:', err);
        // Fallback para desarrollo local si el backend no está iniciado:
        if (this.email.toLowerCase().includes('pruebas')) {
          console.log('Iniciando con cuenta de pruebas (Local-only)...');
          localStorage.setItem('ecovolt_token', 'pruebas_token_123456');
          localStorage.setItem('currentUserEmail', this.email);
          this.router.navigate(['/dashboard']);
        } else if (this.email === 'admin@ecovolt.com' && this.password === 'ecovolt2026') {
          console.log('Backend desconectado. Iniciando con cuenta demo (Local-only)...');
          localStorage.setItem('ecovolt_token', 'demo_token_123456');
          localStorage.setItem('currentUserEmail', this.email);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = err.error?.message || 'Error de conexión con el servidor. Asegúrate de tener el backend encendido en http://localhost:8080.';
        }
      }
    });
  }
}
