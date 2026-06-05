import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

interface Logro {
  icono: string;
  titulo: string;
  descripcion: string;
  obtenido: boolean;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  editMode = false;
  cambiarPasswordMode = false;
  guardadoExitoso = false;

  usuario = {
    nombre: 'Daniel Specter',
    email: 'daniel.specter@ecovolt.com',
    telefono: '+57 314 567 8901',
    ciudad: 'Bogotá, Colombia',
    plan: 'EcoVolt Pro',
    miembro: 'Junio 2024',
    avatar: null as string | null,
  };

  editUsuario = { ...this.usuario };

  passwords = {
    actual: '',
    nueva: '',
    confirmar: '',
  };

  notificaciones = {
    alertasCriticas: true,
    advertencias: true,
    informativas: false,
    resumenSemanal: true,
    newsletter: false,
  };

  logros: Logro[] = [
    {
      icono: 'leaf',
      titulo: 'Eco Iniciado',
      descripcion: 'Primer mes de ahorro',
      obtenido: true,
    },
    {
      icono: 'lightning',
      titulo: 'Ahorrador Eficiente',
      descripcion: '100 kWh ahorrados',
      obtenido: true,
    },
    {
      icono: 'star',
      titulo: 'Maestro de Rutinas',
      descripcion: '5 rutinas activas',
      obtenido: true,
    },
    {
      icono: 'shield',
      titulo: 'Hogar Seguro',
      descripcion: '0 alertas críticas en 30 días',
      obtenido: false,
    },
    {
      icono: 'sun',
      titulo: 'Solar Champion',
      descripcion: 'Panel solar integrado',
      obtenido: false,
    },
  ];

  stats = [
    { valor: '248 kWh', label: 'Total Ahorrado', icono: 'bolt' },
    { valor: '$127.400', label: 'Ahorro económico', icono: 'money' },
    { valor: '12', label: 'Dispositivos', icono: 'device' },
    { valor: '5', label: 'Rutinas activas', icono: 'clock' },
  ];

  getInitials(): string {
    return this.usuario.nombre
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  }

  startEdit() {
    this.editUsuario = { ...this.usuario };
    this.editMode = true;
  }

  cancelEdit() {
    this.editMode = false;
  }

  saveProfile() {
    this.usuario = { ...this.editUsuario };
    this.editMode = false;
    this.guardadoExitoso = true;
    setTimeout(() => (this.guardadoExitoso = false), 3000);
  }

  togglePasswordMode() {
    this.cambiarPasswordMode = !this.cambiarPasswordMode;
    this.passwords = { actual: '', nueva: '', confirmar: '' };
  }

  savePassword() {
    if (this.passwords.nueva !== this.passwords.confirmar) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    this.cambiarPasswordMode = false;
    this.passwords = { actual: '', nueva: '', confirmar: '' };
    this.guardadoExitoso = true;
    setTimeout(() => (this.guardadoExitoso = false), 3000);
  }

  saveNotifications() {
    this.guardadoExitoso = true;
    setTimeout(() => (this.guardadoExitoso = false), 3000);
  }

  constructor(private router: Router) {}

  logout() {
    this.router.navigate(['/login']);
  }
}
