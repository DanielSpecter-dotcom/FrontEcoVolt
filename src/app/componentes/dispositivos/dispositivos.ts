import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService, Dispositivo } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dispositivos.html',
  styleUrl: './dispositivos.css',
})
export class Dispositivos implements OnInit {
  // Dropdown states
  showProfileMenu = false;
  showNotifications = false;

  searchTerm = '';
  showAddModal = false;
  editMode = false;
  selectedDevice: Dispositivo | null = null;

  // Form fields
  newNombre = '';
  newTipo = 'Luz';
  newUbicacion = '';
  newCarga = '';
  newModo: 'AUTO' | 'MANUAL' = 'AUTO';

  tiposDisponibles = ['Luz', 'TV', 'Refrigerador', 'AC', 'Lavadora', 'Cafetera', 'Otro'];

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.stateService.isBackendConnected) {
      this.refreshDevices();
    } else {
      this.stateService.loadFromBackend().then((success) => {
        if (success) this.refreshDevices();
      });
    }
  }

  private refreshDevices() {
    this.apiService.getDevices().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stateService.devices = res.data.map(d => this.stateService['mapDeviceFromBackend'](d));
          this.stateService.saveStateToStorage();
        }
      },
      error: () => {} // Keep existing data
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

  // Getters connected to StateService
  get devices(): Dispositivo[] {
    return this.stateService.devices;
  }

  get userAvatar(): string | null {
    return this.stateService.usuario.avatar;
  }

  get filteredDevices() {
    if (!this.searchTerm.trim()) {
      return this.devices;
    }
    const term = this.searchTerm.toLowerCase();
    return this.devices.filter(d => 
      d.nombre.toLowerCase().includes(term) ||
      d.tipo.toLowerCase().includes(term) ||
      d.ubicacion.toLowerCase().includes(term)
    );
  }

  get totalConsumption(): number {
    const total = this.devices.reduce((acc, curr) => acc + curr.consumoHoy, 0);
    return parseFloat(total.toFixed(1));
  }

  get peakLoad(): number {
    let wattsSum = 0;
    this.devices.forEach(d => {
      if (d.estado) {
        const value = parseInt(d.carga.replace(/\D/g, '')) || 0;
        wattsSum += value;
      }
    });
    if (wattsSum === 0) return 0;
    return Math.max(1.5, parseFloat((wattsSum / 1000).toFixed(1)));
  }

  toggleState(device: Dispositivo, event?: Event) {
    if (event) event.stopPropagation();

    const newState = !device.estado;
    device.estado = newState;

    if (newState) {
      const watts = parseInt(device.carga.replace(/\D/g, '')) || 100;
      device.consumoHoy = parseFloat(((watts * 4) / 1000).toFixed(2));
      device.badge = 'ON';
      device.badgeType = 'efficient';
    } else {
      device.consumoHoy = 0;
      device.badge = 'OFF';
      device.badgeType = 'off';
    }
    device.showMenu = false;
    this.stateService.saveStateToStorage();

    // Sync with backend
    if (device.backendId && this.stateService.isBackendConnected) {
      this.apiService.toggleDeviceStatus(device.backendId, newState ? 'ON' : 'OFF').subscribe({
        error: (err) => console.warn('Error syncing device status:', err)
      });
    }
  }

  toggleModo(device: Dispositivo, event?: Event) {
    if (event) event.stopPropagation();

    const newMode = device.modo === 'AUTO' ? 'MANUAL' : 'AUTO';
    device.modo = newMode;
    device.showMenu = false;
    this.stateService.saveStateToStorage();

    // Sync with backend
    if (device.backendId && this.stateService.isBackendConnected) {
      this.apiService.toggleDeviceMode(
        device.backendId,
        newMode === 'AUTO' ? 'AUTOMATIC' : 'MANUAL'
      ).subscribe({
        error: (err) => console.warn('Error syncing device mode:', err)
      });
    }
  }

  deleteDevice(device: Dispositivo, event?: Event) {
    if (event) event.stopPropagation();

    this.stateService.devices = this.devices.filter(d => d.id !== device.id);
    this.stateService.saveStateToStorage();

    // Sync with backend
    if (device.backendId && this.stateService.isBackendConnected) {
      this.apiService.deleteDevice(device.backendId).subscribe({
        error: (err) => console.warn('Error deleting device on backend:', err)
      });
    }
  }

  toggleMenu(device: Dispositivo, event: Event) {
    event.stopPropagation();
    const currentState = device.showMenu;
    this.devices.forEach(d => d.showMenu = false);
    device.showMenu = !currentState;
  }

  closeAllMenus() {
    this.devices.forEach(d => d.showMenu = false);
  }

  openModal() {
    this.editMode = false;
    this.selectedDevice = null;
    this.newNombre = '';
    this.newTipo = 'Luz';
    this.newUbicacion = '';
    this.newCarga = '';
    this.newModo = 'AUTO';
    this.showAddModal = true;
  }

  openEditModal(device: Dispositivo, event: Event) {
    event.stopPropagation();
    this.editMode = true;
    this.selectedDevice = device;
    this.newNombre = device.nombre;
    this.newTipo = device.tipo;
    this.newUbicacion = device.ubicacion;
    this.newCarga = device.carga;
    this.newModo = device.modo;
    this.showAddModal = true;
    device.showMenu = false;
  }

  closeModal() {
    this.showAddModal = false;
  }

  addDevice() {
    if (!this.newNombre.trim() || !this.newUbicacion.trim() || !this.newCarga.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    let powerStr = this.newCarga.trim().toUpperCase();
    if (!powerStr.endsWith('W') && !powerStr.endsWith('KW')) {
      powerStr += 'W';
    }

    const watts = parseInt(powerStr.replace(/\D/g, '')) || 100;
    const estimatedKwh = parseFloat(((watts * 4) / 1000).toFixed(2));

    const iconMap: { [key: string]: string } = {
      'Luz': 'lamp',
      'TV': 'tv',
      'Refrigerador': 'fridge',
      'AC': 'ac',
      'Lavadora': 'washer',
      'Cafetera': 'coffee',
      'Otro': 'other'
    };

    if (this.editMode && this.selectedDevice) {
      // Edit device locally
      this.selectedDevice.nombre = this.newNombre;
      this.selectedDevice.tipo = this.newTipo;
      this.selectedDevice.ubicacion = this.newUbicacion;
      this.selectedDevice.carga = powerStr;
      this.selectedDevice.modo = this.newModo;
      this.selectedDevice.icon = iconMap[this.newTipo] || 'other';
      if (this.selectedDevice.estado) {
        this.selectedDevice.consumoHoy = estimatedKwh;
      }

      // Sync edit with backend
      if (this.selectedDevice.backendId && this.stateService.isBackendConnected) {
        this.apiService.updateDevice(this.selectedDevice.backendId, {
          nombre: this.newNombre,
          tipo: this.newTipo.toLowerCase(),
          automatico: this.newModo === 'AUTO',
        }).subscribe({
          error: (err) => console.warn('Error updating device on backend:', err)
        });
      }
    } else {
      // Add device
      const newId = 'dev_' + Date.now();
      const newDev: Dispositivo = {
        id: newId,
        nombre: this.newNombre,
        tipo: this.newTipo,
        ubicacion: this.newUbicacion,
        carga: powerStr,
        estado: true,
        consumoHoy: estimatedKwh,
        modo: this.newModo,
        badge: 'EFICIENTE',
        badgeType: 'efficient',
        icon: iconMap[this.newTipo] || 'other',
        showMenu: false
      };

      // Try backend first
      if (this.stateService.isBackendConnected && this.stateService.habitaciones.length > 0) {
        const habitacionId = this.stateService.habitaciones[0].id;
        this.apiService.createDevice({
          habitacion_id: habitacionId,
          nombre: this.newNombre,
          tipo: this.newTipo.toLowerCase(),
          activo: true,
          automatico: this.newModo === 'AUTO',
        }).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              newDev.backendId = res.data.id;
              newDev.id = res.data.id.toString();
              newDev.carga = `${res.data.potencia_watts}W`;
              newDev.ubicacion = res.data.habitacion_nombre || this.newUbicacion;
              newDev.habitacionId = res.data.habitacion_id;
            }
            this.stateService.devices.push(newDev);
            this.stateService.saveStateToStorage();
            this.closeModal();
          },
          error: () => {
            this.stateService.devices.push(newDev);
            this.stateService.saveStateToStorage();
            this.closeModal();
          }
        });
        return;
      }

      this.stateService.devices.push(newDev);
    }

    this.stateService.saveStateToStorage();
    this.closeModal();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
