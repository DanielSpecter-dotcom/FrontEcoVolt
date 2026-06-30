import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { StateService, Rutina, AccionDispositivo, Dispositivo } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';
import { CasaDTO } from '../../modelos';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideDynamicIcon],
  templateUrl: './rutinas.html',
  styleUrl: './rutinas.css',
})
export class Rutinas implements OnInit {
  // Dropdown states
  showProfileMenu = false;
  showNotifications = false;

  selectedRoutine: Rutina | null = null;

  // Working copy for editing
  editNombre = '';
  editHora = '';
  editPeriodo: 'AM' | 'PM' = 'AM';
  editDias: string[] = [];
  editActiva = true;
  editAcciones: AccionDispositivo[] = [];

  diasSemana = ['L', 'M', 'MI', 'J', 'V', 'S', 'D'];

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.stateService.isBackendConnected) {
      this.loadRoutines();
    } else {
      this.stateService.loadFromBackend().then((success) => {
        if (success) this.loadRoutines();
        else if (this.routines.length > 0) this.selectRoutine(this.routines[0]);
      });
    }
  }

  private loadRoutines() {
    this.apiService.getRoutines().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stateService.routines = res.data.map(r => this.stateService['mapRoutineFromBackend'](r));
          this.stateService.saveStateToStorage();
        }
        if (this.routines.length > 0) {
          this.selectRoutine(this.routines[0]);
        }
      },
      error: () => {
        if (this.routines.length > 0) {
          this.selectRoutine(this.routines[0]);
        }
      }
    });
  }

  @HostListener('document:click')
  closeMenus() {
    this.showProfileMenu = false;
    this.showNotifications = false;
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  get userEmail(): string {
    return this.stateService.usuario.email;
  }

  get userName(): string {
    return this.stateService.usuario.nombre;
  }

  get notificationsList() {
    return this.stateService.notificationsList;
  }

  get unreadNotificationsCount(): number {
    return this.stateService.notificationsList.filter(n => !n.leido).length;
  }

  markAllNotificationsAsRead() {
    this.stateService.notificationsList.forEach(n => n.leido = true);
    this.stateService.saveStateToStorage();
  }

  navigateToAlertas() {
    this.showNotifications = false;
    this.router.navigate(['/alertas']);
  }

  get routines(): Rutina[] {
    return this.stateService.rutinasDeCasaSeleccionada;
  }

  get selectedCasaNombre(): string {
    return this.stateService.selectedCasa?.nombre || 'Sin casa seleccionada';
  }

  get resumenPorCasa(): { casa: CasaDTO; activas: number }[] {
    return this.stateService.casas.map(casa => ({
      casa,
      activas: this.stateService.routines.filter(r => r.homeId === casa.id && r.activa).length,
    }));
  }

  get userAvatar(): string | null {
    return this.stateService.usuario.avatar;
  }

  selectRoutine(routine: Rutina) {
    this.selectedRoutine = routine;
    this.editNombre = routine.nombre;
    this.editHora = routine.hora;
    this.editPeriodo = routine.periodo;
    this.editDias = [...routine.dias];
    this.editActiva = routine.activa;
    this.editAcciones = JSON.parse(JSON.stringify(routine.acciones));
  }

  isDaySelected(day: string): boolean {
    return this.editDias.includes(day);
  }

  toggleDay(day: string) {
    if (this.editDias.includes(day)) {
      this.editDias = this.editDias.filter(d => d !== day);
    } else {
      this.editDias.push(day);
    }
  }

  togglePeriod(p: 'AM' | 'PM') {
    this.editPeriodo = p;
  }

  removeAction(actionId: string) {
    this.editAcciones = this.editAcciones.filter(a => a.id !== actionId);
  }

  selectedAddDeviceId = '';

  get registeredDevices(): Dispositivo[] {
    return this.stateService.dispositivosDeCasaSeleccionada;
  }

  addActionForSelected() {
    if (!this.selectedAddDeviceId) {
      alert('Por favor selecciona un dispositivo.');
      return;
    }
    const dev = this.registeredDevices.find(d => d.id === this.selectedAddDeviceId);
    if (!dev) return;

    const exists = this.editAcciones.some(a => a.dispositivo === dev.nombre);
    if (exists) {
      alert(`El dispositivo "${dev.nombre}" ya tiene una acción en esta rutina.`);
      return;
    }

    const newAction: AccionDispositivo = {
      id: 'act_' + Date.now(),
      dispositivo: dev.nombre,
      tipo: dev.tipo.toUpperCase(),
      tipoAccion: 'ENCENDER',
      icon: dev.icon || 'other',
      deviceId: dev.backendId,
    };

    this.editAcciones.push(newAction);
    this.selectedAddDeviceId = '';
  }

  toggleActionType(action: AccionDispositivo) {
    action.tipoAccion = action.tipoAccion === 'ENCENDER' ? 'APAGAR' : 'ENCENDER';
  }

  saveRoutine() {
    if (!this.selectedRoutine) return;
    if (!this.stateService.selectedCasaId && !this.selectedRoutine.homeId) {
      alert('Primero selecciona o crea una casa en Dispositivos.');
      return;
    }
    if (this.editDias.length === 0) {
      alert('Selecciona al menos un día de ejecución.');
      return;
    }
    if (this.editAcciones.length === 0) {
      alert('Agrega al menos una acción con dispositivo.');
      return;
    }

    this.selectedRoutine.nombre = this.editNombre;
    this.selectedRoutine.hora = this.editHora;
    this.selectedRoutine.periodo = this.editPeriodo;
    this.selectedRoutine.dias = [...this.editDias];
    this.selectedRoutine.activa = this.editActiva;
    this.selectedRoutine.estado = this.editActiva ? 'ACTIVA' : 'PAUSADA';
    this.selectedRoutine.acciones = JSON.parse(JSON.stringify(this.editAcciones));

    this.stateService.saveStateToStorage();

    const time24 = this.convertTo24h(this.editHora, this.editPeriodo);
    const backendDays = this.editDias.map(d => StateService.dayToBackend(d));
    const backendAcciones = this.editAcciones
      .filter(a => a.deviceId)
      .map(a => ({
        device_id: a.deviceId!,
        encendido: a.tipoAccion === 'ENCENDER'
      }));

    if (this.stateService.isBackendConnected && backendAcciones.length !== this.editAcciones.length) {
      alert('Todas las acciones deben usar dispositivos creados en el backend.');
      return;
    }

    // Sync with backend
    if (this.selectedRoutine.backendId && this.stateService.isBackendConnected) {
      this.apiService.updateRoutine(this.selectedRoutine.backendId, {
        name: this.editNombre,
        execution_time: time24,
        days_of_week: backendDays,
        acciones: backendAcciones,
        enabled: this.editActiva,
      }).subscribe({
        next: () => alert('Rutina guardada correctamente.'),
        error: (err) => {
          console.warn('Error syncing routine:', err);
          alert('Rutina guardada localmente. Error al sincronizar con el servidor.');
        }
      });
    } else if (this.stateService.isBackendConnected) {
      this.apiService.createRoutine({
        home_id: this.selectedRoutine.homeId || this.stateService.selectedCasaId!,
        nombre: this.editNombre,
        execution_time: time24,
        days_of_week: backendDays,
        acciones: backendAcciones,
      }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const created = this.stateService.mapRoutineFromBackend(res.data);
            const index = this.stateService.routines.findIndex(r => r.id === this.selectedRoutine?.id);
            if (index >= 0) {
              this.stateService.routines[index] = created;
              this.selectRoutine(created);
            }
            this.stateService.saveStateToStorage();
            alert('Rutina creada correctamente.');
          }
        },
        error: (err) => {
          console.warn('Error creating routine:', err);
          alert(err.error?.message || 'No se pudo crear la rutina en el servidor.');
        }
      });
    } else {
      alert('Rutina guardada correctamente.');
    }
  }

  private convertTo24h(hora: string, periodo: 'AM' | 'PM'): string {
    const [h, m] = hora.split(':').map(Number);
    let hour24 = h;
    if (periodo === 'PM' && h !== 12) hour24 = h + 12;
    if (periodo === 'AM' && h === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
  }

  discardChanges() {
    if (this.selectedRoutine) {
      this.selectRoutine(this.selectedRoutine);
    }
  }

  createRoutine() {
    if (!this.stateService.selectedCasaId) {
      alert('Primero crea o selecciona una casa en Dispositivos.');
      return;
    }
    this.createRoutineLocally();
  }

  private createRoutineLocally() {
    const newId = 'routine_' + Date.now();
    const newRoutine: Rutina = {
      id: newId,
      homeId: this.stateService.selectedCasaId || undefined,
      nombre: 'Nueva Rutina',
      hora: '12:00',
      periodo: 'PM',
      dias: ['L'],
      activa: true,
      estado: 'ACTIVA',
      acciones: []
    };
    this.stateService.routines.push(newRoutine);
    this.stateService.saveStateToStorage();
    this.selectRoutine(newRoutine);
  }

  deleteRoutine(routine: Rutina, event: Event) {
    event.stopPropagation();
    this.stateService.routines = this.routines.filter(r => r.id !== routine.id);
    if (this.selectedRoutine?.id === routine.id) {
      this.selectedRoutine = this.routines.length > 0 ? this.routines[0] : null;
      if (this.selectedRoutine) {
        this.selectRoutine(this.selectedRoutine);
      }
    }
    this.stateService.saveStateToStorage();

    // Sync with backend
    if (routine.backendId && this.stateService.isBackendConnected) {
      this.apiService.deleteRoutine(routine.backendId).subscribe({
        error: (err) => console.warn('Error deleting routine:', err)
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
