import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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

  constructor(private router: Router) {}

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmit() {
    if (this.email === 'admin@ecovolt.com' && this.password === 'ecovolt2026') {
      this.errorMessage = null;
      console.log('Login exitoso. Redirigiendo...');
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = 'Credenciales incorrectas. Para pruebas usa: admin@ecovolt.com y contraseña ecovolt2026';
    }
  }
}
