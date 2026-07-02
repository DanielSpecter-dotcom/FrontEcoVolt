import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  showPaymentModal = false;
  isProcessingPayment = false;
  paymentCardholder = '';
  paymentCardNumber = '';
  paymentExpiry = '';
  paymentCvv = '';

  constructor(
    public stateService: StateService,
    private apiService: ApiService,
  ) {}

  ngOnInit() {
    if (this.stateService.isBackendConnected) {
      this.loadProfile();
    } else {
      this.stateService.loadFromBackend().then(() => {
        this.syncLocalNotifications();
      });
    }
    this.syncLocalNotifications();
  }

  syncLocalNotifications() {
    this.notificaciones.alertasCriticas = this.stateService.notificaciones.consumoCritico;
    this.notificaciones.advertencias = this.stateService.notificaciones.mantenimiento;
    this.notificaciones.resumenSemanal = this.stateService.notificaciones.reporteMensual;
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
          this.stateService.usuario.telefono = dto.telefono || '';
          this.stateService.usuario.ciudad = dto.ciudad || 'Lima, Perú';
          this.stateService.usuario.tipoUsuario = dto.tipo_usuario || 'PERSONAL';
          this.stateService.usuario.plan = dto.tipo_usuario === 'EMPRESARIAL' ? 'EcoVolt Empresarial' : 'EcoVolt Personal';
          this.stateService.notificaciones.consumoCritico = dto.consumo_excesivo ?? true;
          this.stateService.notificaciones.reporteMensual = dto.reporte_semanal ?? true;
          this.stateService.saveStateToStorage();
          this.syncLocalNotifications();
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
      this.stateService.showToast('ADVERTENCIA', 'Campo requerido', 'El nombre es obligatorio.');
      return;
    }

    // Sync with backend
    if (this.stateService.userId && this.stateService.isBackendConnected) {
      const parts = this.editUsuario.nombre.trim().split(/\s+/);
      const nombre = parts[0] || '';
      const apellido = parts.slice(1).join(' ');

      this.apiService.updateUser(this.stateService.userId, {
        nombre: nombre,
        apellido: apellido,
        correo: this.editUsuario.email.trim(),
        telefono: this.editUsuario.telefono.trim(),
        ciudad: this.editUsuario.ciudad.trim()
      }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const fullName = [res.data.nombre, res.data.apellido].filter(Boolean).join(' ');
            this.editUsuario.nombre = fullName;
            this.editUsuario.email = res.data.correo;
            this.editUsuario.telefono = res.data.telefono || '';
            this.editUsuario.ciudad = res.data.ciudad || '';
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
    // Update local state service
    this.stateService.notificaciones.consumoCritico = this.notificaciones.alertasCriticas;
    this.stateService.notificaciones.mantenimiento = this.notificaciones.advertencias;
    this.stateService.notificaciones.reporteMensual = this.notificaciones.resumenSemanal;
    this.stateService.saveStateToStorage();

    // Sync with backend
    if (this.stateService.userId && this.stateService.isBackendConnected) {
      this.apiService.updateNotificationSettings(this.stateService.userId, {
        consumo_excesivo: this.notificaciones.alertasCriticas,
        uso_prolongado: this.notificaciones.advertencias,
        reporte_semanal: this.notificaciones.resumenSemanal,
      }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.stateService.notificaciones.consumoCritico = res.data.consumo_excesivo ?? true;
            this.stateService.notificaciones.reporteMensual = res.data.reporte_semanal ?? true;
            this.stateService.saveStateToStorage();
          }
          this.guardadoExitoso = true;
          setTimeout(() => (this.guardadoExitoso = false), 3000);
        },
        error: (err) => {
          console.warn('Error saving notifications to backend:', err);
          this.guardadoExitoso = true;
          setTimeout(() => (this.guardadoExitoso = false), 3000);
        }
      });
    } else {
      this.guardadoExitoso = true;
      setTimeout(() => (this.guardadoExitoso = false), 3000);
    }
  }

  actualizarPlanAEmpresarial() {
    this.stateService.usuario.plan = 'EcoVolt Empresarial';
    this.stateService.usuario.tipoUsuario = 'EMPRESARIAL';
    this.stateService.userRole = 'EMPRESARIAL';
    localStorage.setItem('ecovolt_user_role', 'EMPRESARIAL');
    this.stateService.saveStateToStorage();

    // Attempt to sync with backend if possible
    if (this.stateService.userId && this.stateService.isBackendConnected) {
      const parts = this.usuario.nombre.trim().split(/\s+/);
      const nombre = parts[0] || '';
      const apellido = parts.slice(1).join(' ');

      this.apiService.updateUser(this.stateService.userId, {
        nombre: nombre,
        apellido: apellido,
        correo: this.usuario.email.trim(),
        telefono: this.usuario.telefono.trim(),
        ciudad: this.usuario.ciudad.trim(),
        ...({ tipo_usuario: 'EMPRESARIAL' } as any)
      } as any).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.stateService.usuario.plan = res.data.tipo_usuario === 'EMPRESARIAL' ? 'EcoVolt Empresarial' : 'EcoVolt Personal';
            this.stateService.usuario.tipoUsuario = res.data.tipo_usuario || 'EMPRESARIAL';
            this.stateService.userRole = res.data.tipo_usuario || 'EMPRESARIAL';
            localStorage.setItem('ecovolt_user_role', this.stateService.userRole);
          }
          this.stateService.saveStateToStorage();
          this.guardadoExitoso = true;
          setTimeout(() => (this.guardadoExitoso = false), 3000);
        },
        error: (err) => {
          console.warn('Error updating plan on backend:', err);
          this.guardadoExitoso = true;
          setTimeout(() => (this.guardadoExitoso = false), 3000);
        }
      });
    } else {
      this.guardadoExitoso = true;
      setTimeout(() => (this.guardadoExitoso = false), 3000);
    }
  }

  abrirSimulacionPago() {
    this.showPaymentModal = true;
    this.paymentCardNumber = '4557 8812 3456 7890';
    this.paymentExpiry = '12/29';
    this.paymentCvv = '123';
    this.paymentCardholder = this.usuario.nombre || 'Carlos Mendoza';
  }

  cerrarSimulacionPago() {
    this.showPaymentModal = false;
    this.isProcessingPayment = false;
  }

  procesarSimulacionPago() {
    this.isProcessingPayment = true;
    setTimeout(() => {
      this.actualizarPlanAEmpresarial();
      this.cerrarSimulacionPago();
    }, 2000);
  }

}
