import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';

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
export class Perfil implements OnInit {
  editMode = false;
  cambiarPasswordMode = false;
  guardadoExitoso = false;
  errorMessage = '';

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
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.stateService.isBackendConnected) {
      this.loadProfile();
    } else {
      this.stateService.loadFromBackend();
    }
  }

  private loadProfile() {
    this.apiService.getMe().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const dto = res.data;
          const fullName = [dto.nombre, dto.apellido].filter(Boolean).join(' ') || 'Usuario';
          this.stateService.usuario.nombre = fullName;
          this.stateService.usuario.email = dto.correo;
          this.stateService.usuario.apellido = dto.apellido || '';
          this.stateService.usuario.username = dto.username || '';
          this.stateService.usuario.tipoUsuario = dto.tipo_usuario || 'PERSONAL';
          this.stateService.usuario.plan = dto.tipo_usuario === 'EMPRESARIAL' ? 'EcoVolt Empresarial' : 'EcoVolt Personal';
          this.stateService.notificaciones.consumoCritico = dto.consumo_excesivo ?? true;
          this.stateService.notificaciones.reporteMensual = dto.reporte_semanal ?? true;
          this.stateService.saveStateToStorage();
        }
      },
      error: () => {}
    });
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
    this.errorMessage = '';
  }

  cancelEdit() {
    this.editMode = false;
    this.errorMessage = '';
  }

  saveProfile() {
    if (!this.editUsuario.nombre.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    // Sync with backend
    if (this.stateService.userId && this.stateService.isBackendConnected) {
      this.apiService.updateUser(this.stateService.userId, {
        nombre: this.editUsuario.nombre.trim()
      }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const fullName = [res.data.nombre, res.data.apellido].filter(Boolean).join(' ');
            this.editUsuario.nombre = fullName;
          }
          this.stateService.saveProfile(this.editUsuario);
          this.editMode = false;
          this.guardadoExitoso = true;
          setTimeout(() => (this.guardadoExitoso = false), 3000);
        },
        error: (err) => {
          console.warn('Error updating profile on backend:', err);
          // Save locally anyway
          this.stateService.saveProfile(this.editUsuario);
          this.editMode = false;
          this.guardadoExitoso = true;
          setTimeout(() => (this.guardadoExitoso = false), 3000);
        }
      });
    } else {
      this.stateService.saveProfile(this.editUsuario);
      this.editMode = false;
      this.guardadoExitoso = true;
      setTimeout(() => (this.guardadoExitoso = false), 3000);
    }
  }

  togglePasswordMode() {
    this.cambiarPasswordMode = !this.cambiarPasswordMode;
    this.passwords = { actual: '', nueva: '', confirmar: '' };
    this.errorMessage = '';
  }

  savePassword() {
    if (this.passwords.nueva !== this.passwords.confirmar) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.passwords.nueva.length < 8) {
      this.errorMessage = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    // Sync with backend
    if (this.stateService.userId && this.stateService.isBackendConnected) {
      this.apiService.changePassword(this.stateService.userId, {
        contrasena_actual: this.passwords.actual,
        nueva_contrasena: this.passwords.nueva
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.cambiarPasswordMode = false;
            this.passwords = { actual: '', nueva: '', confirmar: '' };
            this.errorMessage = '';
            this.guardadoExitoso = true;
            setTimeout(() => (this.guardadoExitoso = false), 3000);
          } else {
            this.errorMessage = res.message || 'Error al cambiar la contraseña.';
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al cambiar la contraseña. Verifique su contraseña actual.';
        }
      });
    } else {
      this.cambiarPasswordMode = false;
      this.passwords = { actual: '', nueva: '', confirmar: '' };
      this.guardadoExitoso = true;
      setTimeout(() => (this.guardadoExitoso = false), 3000);
    }
  }

  saveNotifications() {
    // Sync with backend
    if (this.stateService.userId && this.stateService.isBackendConnected) {
      this.apiService.updateNotificationSettings(this.stateService.userId, {
        consumo_excesivo: this.notificaciones.alertasCriticas,
        uso_prolongado: this.notificaciones.advertencias,
        reporte_semanal: this.notificaciones.resumenSemanal,
      }).subscribe({
        next: () => {
          this.guardadoExitoso = true;
          setTimeout(() => (this.guardadoExitoso = false), 3000);
        },
        error: () => {
          this.guardadoExitoso = true;
          setTimeout(() => (this.guardadoExitoso = false), 3000);
        }
      });
    } else {
      this.guardadoExitoso = true;
      setTimeout(() => (this.guardadoExitoso = false), 3000);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
