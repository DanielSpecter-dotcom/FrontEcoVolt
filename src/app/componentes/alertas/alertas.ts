import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService, Alerta } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css',
})
export class Alertas implements OnInit {
  // Dropdown states
  showProfileMenu = false;
  showNotifications = false;

  filtroActivo: 'TODAS' | 'CRITICA' | 'ADVERTENCIA' | 'INFO' | 'NO_LEIDAS' = 'TODAS';
  busqueda = '';
  mostrarModal = false;
  alertaSeleccionada: Alerta | null = null;

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.stateService.isBackendConnected) {
      this.loadAlerts();
    } else {
      this.stateService.loadFromBackend().then((success) => {
        if (success) this.loadAlerts();
      });
    }
  }

  private loadAlerts() {
    this.apiService.getAlertHistory().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stateService.alertas = res.data.map(a => this.mapAlert(a));
          this.stateService.saveStateToStorage();
        }
      },
      error: () => {} // Keep existing alerts
    });
  }

  private mapAlert(dto: any): Alerta {
    let tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO' = 'INFO';
    const backendTipo = (dto.tipo || '').toUpperCase();
    if (backendTipo.includes('CRIT') || backendTipo.includes('CRITICA')) tipo = 'CRITICA';
    else if (backendTipo.includes('ADVERT') || backendTipo.includes('WARNING')) tipo = 'ADVERTENCIA';

    let fecha = 'Hoy';
    let hora = '';
    if (dto.fecha_creacion) {
      const d = new Date(dto.fecha_creacion);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        fecha = 'Hoy';
      } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        fecha = d.toDateString() === yesterday.toDateString() ? 'Ayer' : d.toLocaleDateString('es-ES');
      }
      hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    return {
      id: dto.id.toString(),
      backendId: dto.id,
      tipo,
      titulo: dto.mensaje?.substring(0, 50) || 'Alerta',
      descripcion: dto.mensaje || '',
      dispositivo: dto.device_name || 'Sistema',
      icono: 'lightning',
      fecha,
      hora,
      leida: dto.leido,
      activa: !dto.leido,
      deviceId: dto.device_id,
    };
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

  get alertas(): Alerta[] {
    return this.stateService.alertas;
  }

  get userAvatar(): string | null {
    return this.stateService.usuario.avatar;
  }

  get alertasFiltradas(): Alerta[] {
    return this.alertas.filter(a => {
      const matchFiltro =
        this.filtroActivo === 'TODAS' ? true :
        this.filtroActivo === 'NO_LEIDAS' ? !a.leida :
        a.tipo === this.filtroActivo;

      const matchBusqueda = this.busqueda.trim() === '' ||
        a.titulo.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        a.dispositivo.toLowerCase().includes(this.busqueda.toLowerCase());

      return matchFiltro && matchBusqueda;
    });
  }

  get totalCriticas(): number {
    return this.alertas.filter(a => a.tipo === 'CRITICA').length;
  }

  get totalAdvertencias(): number {
    return this.alertas.filter(a => a.tipo === 'ADVERTENCIA').length;
  }

  get totalNoLeidas(): number {
    return this.alertas.filter(a => !a.leida).length;
  }

  get totalInfo(): number {
    return this.alertas.filter(a => a.tipo === 'INFO').length;
  }

  setFiltro(filtro: 'TODAS' | 'CRITICA' | 'ADVERTENCIA' | 'INFO' | 'NO_LEIDAS') {
    this.filtroActivo = filtro;
  }

  verDetalle(alerta: Alerta) {
    alerta.leida = true;
    this.alertaSeleccionada = alerta;
    this.mostrarModal = true;

    // Sync with backend
    if (alerta.backendId && this.stateService.isBackendConnected) {
      this.apiService.markAlertRead(alerta.backendId).subscribe({
        error: (err) => console.warn('Error marking alert as read:', err)
      });
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.alertaSeleccionada = null;
  }

  marcarLeida(alerta: Alerta) {
    alerta.leida = true;
    this.stateService.saveStateToStorage();

    if (alerta.backendId && this.stateService.isBackendConnected) {
      this.apiService.markAlertRead(alerta.backendId).subscribe({
        error: (err) => console.warn('Error marking alert as read:', err)
      });
    }
  }

  marcarTodasLeidas() {
    this.alertas.forEach(a => {
      a.leida = true;
      if (a.backendId && this.stateService.isBackendConnected) {
        this.apiService.markAlertRead(a.backendId).subscribe();
      }
    });
    this.stateService.saveStateToStorage();
  }

  eliminarAlerta(id: string) {
    const alerta = this.alertas.find(a => a.id === id);
    this.stateService.alertas = this.alertas.filter(a => a.id !== id);
    this.stateService.saveStateToStorage();
    if (this.alertaSeleccionada?.id === id) this.cerrarModal();

    // Sync with backend
    if (alerta?.backendId && this.stateService.isBackendConnected) {
      this.apiService.deleteAlert(alerta.backendId).subscribe({
        error: (err) => console.warn('Error deleting alert:', err)
      });
    }
  }

  getIconPath(icono: string): string {
    const icons: { [key: string]: string } = {
      ac: 'M3 8h18v8H3zM7 12h2M15 12h2',
      washer: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 14a4 4 0 100-8 4 4 0 000 8z',
      routine: 'M12 2v10l4 4M12 22a10 10 0 100-20 10 10 0 000 20z',
      solar: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      lightning: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      thermostat: 'M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z',
      leaf: 'M17 8C8 10 5.9 16.17 3.82 19c0 0 6-4 11.5-3.5C15.71 15.55 18 13 18 10a6 6 0 00-1-2z'
    };
    return icons[icono] || 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
