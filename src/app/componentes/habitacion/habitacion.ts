import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { StateService } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';
import { CasaDTO, HabitacionDTO, Dispositivo } from '../../modelos';

interface HabitacionConDatos {
  habitacion: HabitacionDTO;
  dispositivos: Dispositivo[];
  consumoHoy: number;
  colorClass: string;
  badge: { texto: string; clase: string };
}

@Component({
  selector: 'app-habitacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideDynamicIcon],
  templateUrl: './habitacion.html',
  styleUrl: './habitacion.css',
})
export class Habitacion implements OnInit {
  showProfileMenu = false;
  showNotifications = false;

  newHabitacionNombre = '';
  isCreatingRoom = false;

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    if (!this.stateService.isBackendConnected) {
      this.stateService.loadFromBackend();
    }
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

  get userAvatar(): string | null {
    return this.stateService.usuario.avatar;
  }

  get notificationsList() {
    return this.stateService.notificationsList;
  }

  get unreadNotificationsCount(): number {
    return this.stateService.notificationsList.filter((n) => !n.leido).length;
  }

  markAllNotificationsAsRead() {
    this.stateService.notificationsList.forEach((n) => (n.leido = true));
    this.stateService.saveStateToStorage();
  }

  navigateToAlertas() {
    this.showNotifications = false;
    this.router.navigate(['/alertas']);
  }

  // ==================== Casa seleccionada (combo box) ====================

  get casas(): CasaDTO[] {
    return this.stateService.casas;
  }

  get selectedCasaId(): number | null {
    return this.stateService.selectedCasaId;
  }

  onCasaChange(casaId: number | null) {
    this.stateService.setActiveHome(casaId);
  }

  get casaSeleccionadaNombre(): string {
    return this.stateService.selectedCasa?.nombre || 'Sin casa seleccionada';
  }

  // ==================== Habitaciones + datos enriquecidos ====================

  /** Asigna un color según palabras clave en el nombre de la habitación */
  private getColorClass(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('sala') || n.includes('living')) return 'color-azul';
    if (n.includes('cocina')) return 'color-amarillo';
    if (n.includes('dormitorio') || n.includes('cuarto') || n.includes('habitacion'))
      return 'color-morado';
    if (n.includes('baño') || n.includes('bano')) return 'color-celeste';
    if (n.includes('oficina') || n.includes('estudio')) return 'color-gris';
    if (n.includes('lavanderia') || n.includes('lavandería')) return 'color-verde';
    if (n.includes('comedor')) return 'color-naranja';
    if (n.includes('terraza') || n.includes('jardin') || n.includes('jardín')) return 'color-verde';
    return 'color-gris';
  }

  /** Calcula el badge según datos reales de la habitación */
  private getBadge(
    dispositivos: Dispositivo[],
    consumoHoy: number,
    esLaMasEficiente: boolean,
  ): { texto: string; clase: string } {
    if (dispositivos.length === 0) {
      return { texto: 'Sin equipos', clase: 'badge-gris' };
    }
    if (esLaMasEficiente) {
      return { texto: 'Más eficiente', clase: 'badge-verde' };
    }
    if (consumoHoy >= 4) {
      return { texto: 'Alto consumo', clase: 'badge-naranja' };
    }
    return { texto: 'Normal', clase: 'badge-verde-claro' };
  }

  /** Habitaciones de la casa seleccionada, enriquecidas con dispositivos/consumo/badge/color */
  get habitacionesConDatos(): HabitacionConDatos[] {
    const habitaciones = this.stateService.habitacionesDeCasaSeleccionada;

    // Primero calculamos consumo de cada habitación para saber cuál es la más eficiente
    const base = habitaciones.map((hab) => {
      const dispositivos = this.stateService.devices.filter((d) => d.habitacionId === hab.id);
      const consumoHoy = parseFloat(
        dispositivos.reduce((acc, d) => acc + (d.consumoHoy || 0), 0).toFixed(1),
      );
      return { habitacion: hab, dispositivos, consumoHoy };
    });

    // La "más eficiente" es la que tiene dispositivos y el menor consumo (mayor a 0)
    const conDispositivos = base.filter((b) => b.dispositivos.length > 0);
    const minConsumo =
      conDispositivos.length > 0 ? Math.min(...conDispositivos.map((b) => b.consumoHoy)) : null;

    return base.map((b) => {
      const esLaMasEficiente =
        minConsumo !== null && b.consumoHoy === minConsumo && b.dispositivos.length > 0;
      return {
        habitacion: b.habitacion,
        dispositivos: b.dispositivos,
        consumoHoy: b.consumoHoy,
        colorClass: this.getColorClass(b.habitacion.name),
        badge: this.getBadge(b.dispositivos, b.consumoHoy, esLaMasEficiente),
      };
    });
  }

  get totalHabitaciones(): number {
    return this.habitacionesConDatos.length;
  }

  get totalDispositivosEnCasa(): number {
    return this.stateService.dispositivosDeCasaSeleccionada.length;
  }

  get totalAmbientesActivos(): number {
    return this.habitacionesConDatos.filter((h) => h.dispositivos.some((d) => d.estado)).length;
  }

  get habitacionMasEficiente(): string {
    const eficiente = this.habitacionesConDatos.find((h) => h.badge.texto === 'Más eficiente');
    return eficiente ? eficiente.habitacion.name : '—';
  }

  get consumoTotalCasaHoy(): number {
    const total = this.stateService.dispositivosDeCasaSeleccionada.reduce(
      (acc, d) => acc + (d.consumoHoy || 0),
      0,
    );
    return parseFloat(total.toFixed(1));
  }

  /** Barra de "consumo relativo": porcentaje respecto a la habitación de mayor consumo de la casa */
  consumoRelativoPorcentaje(habConsumo: number): number {
    const max = Math.max(...this.habitacionesConDatos.map((h) => h.consumoHoy), 0.01);
    return Math.round((habConsumo / max) * 100);
  }

  createRoom() {
    const nombre = this.newHabitacionNombre.trim();
    if (!nombre) {
      alert('Ingresa un nombre para la habitación.');
      return;
    }
    if (!this.selectedCasaId) {
      alert('Primero selecciona una casa.');
      return;
    }

    this.isCreatingRoom = true;
    if (this.stateService.isBackendConnected) {
      this.apiService.createRoom({ casa_id: this.selectedCasaId, nombre }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.stateService.habitaciones.push(res.data);
            this.newHabitacionNombre = '';
          }
          this.isCreatingRoom = false;
        },
        error: (err) => {
          this.isCreatingRoom = false;
          alert(err.error?.message || 'No se pudo crear la habitación.');
        },
      });
      return;
    }

    const localRoom: HabitacionDTO = {
      id: Date.now(),
      name: nombre,
      casa_id: this.selectedCasaId,
    };
    this.stateService.habitaciones.push(localRoom);
    this.newHabitacionNombre = '';
    this.isCreatingRoom = false;
  }

  /** Navega a Dispositivos filtrado por esta habitación */
  verDispositivos(habitacionId: number, event: Event) {
    event.stopPropagation();
    this.stateService.setActiveRoom(habitacionId);
    this.router.navigate(['/dispositivos']);
  }

  editarHabitacion(hab: HabitacionDTO, event: Event) {
    event.stopPropagation();
    const nuevoNombre = prompt('Nuevo nombre para la habitación:', hab.name);
    if (!nuevoNombre || !nuevoNombre.trim() || !this.selectedCasaId) return;

    const nombre = nuevoNombre.trim();
    if (this.stateService.isBackendConnected) {
      this.apiService.updateRoom(hab.id, { casa_id: this.selectedCasaId, nombre }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            hab.name = res.data.name;
          } else {
            hab.name = nombre;
          }
        },
        error: () => {
          alert('No se pudo actualizar en el servidor, pero se cambió localmente.');
          hab.name = nombre;
        },
      });
    } else {
      hab.name = nombre;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
