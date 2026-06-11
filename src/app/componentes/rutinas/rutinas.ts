import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService, Rutina, AccionDispositivo, Dispositivo } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

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

  get routines(): Rutina[] {
    return this.stateService.routines;
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
    return this.stateService.devices;
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
    
    this.selectedRoutine.nombre = this.editNombre;
    this.selectedRoutine.hora = this.editHora;
    this.selectedRoutine.periodo = this.editPeriodo;
    this.selectedRoutine.dias = [...this.editDias];
    this.selectedRoutine.activa = this.editActiva;
    this.selectedRoutine.estado = this.editActiva ? 'ACTIVA' : 'PAUSADA';
    this.selectedRoutine.acciones = JSON.parse(JSON.stringify(this.editAcciones));

    this.stateService.saveStateToStorage();

    // Sync with backend
    if (this.selectedRoutine.backendId && this.stateService.isBackendConnected) {
      // Convert frontend time to 24h HH:mm format
      const time24 = this.convertTo24h(this.editHora, this.editPeriodo);
      // Convert days to backend format
      const backendDays = this.editDias.map(d => StateService.dayToBackend(d));
      // Convert actions
      const backendAcciones = this.editAcciones
        .filter(a => a.deviceId)
        .map(a => ({
          device_id: a.deviceId!,
          encendido: a.tipoAccion === 'ENCENDER'
        }));

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
    const homeId = this.stateService.casas.length > 0 ? this.stateService.casas[0].id : 1;

    if (this.stateService.isBackendConnected) {
      this.apiService.createRoutine({
        home_id: homeId,
        nombre: 'Nueva Rutina',
        execution_time: '12:00',
        days_of_week: ['MONDAY'],
        acciones: [],
      }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const newRoutine = this.stateService['mapRoutineFromBackend'](res.data);
            this.stateService.routines.push(newRoutine);
            this.stateService.saveStateToStorage();
            this.selectRoutine(newRoutine);
          }
        },
        error: () => this.createRoutineLocally()
      });
    } else {
      this.createRoutineLocally();
    }
  }

  private createRoutineLocally() {
    const newId = (this.routines.length + 1).toString();
    const newRoutine: Rutina = {
      id: newId,
      nombre: 'Nueva Rutina ' + newId,
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
