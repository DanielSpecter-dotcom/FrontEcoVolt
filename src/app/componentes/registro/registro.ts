import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  selectedAccountType: 'personal' | 'enterprise' = 'personal';
  isPasswordVisible = false;

  setAccountType(type: 'personal' | 'enterprise') {
    this.selectedAccountType = type;
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmit() {
    // Lógica de registro pendiente
    console.log('Formulario enviado');
  }
}

