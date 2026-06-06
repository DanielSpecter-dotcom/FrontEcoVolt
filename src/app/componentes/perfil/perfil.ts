import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService } from '../../servicios/state.service';

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

  editUsuario = {
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    plan: '',
    miembro: '',
    avatar: null as string | null
  };

  passwords = {
    actual: '',
    nueva: '',
    confirmar: '',
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

  constructor(
    private router: Router,
    public stateService: StateService
  ) {
    this.stateService.loadState();
  }

  get usuario() {
    return this.stateService.usuario;
  }

  notificaciones = {
    alertasCriticas: true,
    advertencias: true,
    informativas: false,
    resumenSemanal: true,
    newsletter: false,
  };

  get stats() {
    const devicesCount = this.stateService.devices.length;
    const routinesCount = this.stateService.routines.filter(r => r.activa).length;
    const isTest = this.stateService.isTestUser();
    
    const totalSaved = isTest ? '0 kWh' : '248 kWh';
    const moneySaved = isTest ? 'S/. 0.00' : 'S/. 127.40';
    return [
      { valor: totalSaved, label: 'Total Ahorrado', icono: 'bolt' },
      { valor: moneySaved, label: 'Ahorro económico', icono: 'money' },
      { valor: devicesCount.toString(), label: 'Dispositivos', icono: 'device' },
      { valor: routinesCount.toString(), label: 'Rutinas activas', icono: 'clock' },
    ];
  }

  getInitials(): string {
    if (!this.usuario.nombre) return 'U';
    return this.usuario.nombre
      .split(' ')
      .filter(n => n.length > 0)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  startEdit() {
    this.editUsuario = { ...this.usuario };
    this.editMode = true;
  }

  cancelEdit() {
    this.editMode = false;
  }

  saveProfile() {
    if (!this.editUsuario.nombre.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }
    this.stateService.saveProfile(this.editUsuario);
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

  logout() {
    this.router.navigate(['/login']);
  }
}
