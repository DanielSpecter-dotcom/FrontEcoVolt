import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';
import { CasaDTO, Dispositivo, HabitacionDTO } from '../../modelos';

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

  /** Guard flag to prevent double-click submissions */
  isSubmitting = false;
  isCreatingHome = false;
  isCreatingRoom = false;

  // Form fields
  newCasaNombre = '';
  newHabitacionNombre = '';
  newNombre = '';
  newTipo = 'Luz';
  newHabitacionId: number | null = null;
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

  /** Reloads the full device list from backend, replacing local state */
  private refreshDevices() {
    this.apiService.getDevices().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stateService.devices = res.data.map(d => this.stateService.mapDeviceFromBackend(d));
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
    return this.stateService.dispositivosDeHabitacionSeleccionada;
  }

  get casas(): CasaDTO[] {
    return this.stateService.casas;
  }

  get habitaciones(): HabitacionDTO[] {
    return this.stateService.habitacionesDeCasaSeleccionada;
  }

  get selectedCasaId(): number | null {
    return this.stateService.selectedCasaId;
  }

  get selectedHabitacionId(): number | null {
    return this.stateService.selectedHabitacionId;
  }

  onCasaChange(casaId: number | null) {
    this.stateService.setActiveHome(casaId);
    this.newHabitacionId = this.stateService.selectedHabitacionId;
  }

  onHabitacionChange(habitacionId: number | null) {
    this.stateService.setActiveRoom(habitacionId);
    this.newHabitacionId = habitacionId;
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

  createHome() {
    if (!this.stateService.puedeCrearCasa) {
      alert('Tu plan Personal permite gestionar 1 sola casa. Actualiza a EcoVolt Empresarial para administrar más propiedades.');
      return;
    }

    const nombre = this.newCasaNombre.trim();
    if (!nombre) {
      alert('Ingresa un nombre para la casa.');
      return;
    }

    const userId = this.stateService.userId || this.authService.getUserId();
    if (!userId && this.stateService.isBackendConnected) {
      alert('No se pudo identificar el usuario actual.');
      return;
    }

    this.isCreatingHome = true;
    if (this.stateService.isBackendConnected && userId) {
      this.apiService.createHome({ nombre, usuario_id: userId }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.stateService.casas.push(res.data);
            this.stateService.setActiveHome(res.data.id);
            this.stateService.hogar.nombrePropiedad = res.data.nombre;
            this.newCasaNombre = '';
          }
          this.isCreatingHome = false;
        },
        error: (err) => {
          this.isCreatingHome = false;
          alert(err.error?.message || 'No se pudo crear la casa.');
        }
      });
      return;
    }

    const localCasa: CasaDTO = { id: Date.now(), nombre, usuario_id: userId || 0 };
    this.stateService.casas.push(localCasa);
    this.stateService.setActiveHome(localCasa.id);
    this.newCasaNombre = '';
    this.isCreatingHome = false;
  }

  createRoom() {
    const nombre = this.newHabitacionNombre.trim();
    if (!nombre) {
      alert('Ingresa un nombre para la habitación.');
      return;
    }
    if (!this.stateService.selectedCasaId) {
      alert('Primero selecciona o crea una casa.');
      return;
    }

    this.isCreatingRoom = true;
    if (this.stateService.isBackendConnected) {
      this.apiService.createRoom({ casa_id: this.stateService.selectedCasaId, nombre }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.stateService.habitaciones.push(res.data);
            this.stateService.setActiveRoom(res.data.id);
            this.newHabitacionNombre = '';
            this.newHabitacionId = res.data.id;
          }
          this.isCreatingRoom = false;
        },
        error: (err) => {
          this.isCreatingRoom = false;
          alert(err.error?.message || 'No se pudo crear la habitación.');
        }
      });
      return;
    }

    const localRoom: HabitacionDTO = {
      id: Date.now(),
      name: nombre,
      casa_id: this.stateService.selectedCasaId,
    };
    this.stateService.habitaciones.push(localRoom);
    this.stateService.setActiveRoom(localRoom.id);
    this.newHabitacionNombre = '';
    this.newHabitacionId = localRoom.id;
    this.isCreatingRoom = false;
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
    this.isSubmitting = false;
    this.newNombre = '';
    this.newTipo = 'Luz';
    this.newHabitacionId = this.stateService.selectedHabitacionId;
    this.newUbicacion = '';
    this.newCarga = '';
    this.newModo = 'AUTO';
    this.showAddModal = true;
  }

  openEditModal(device: Dispositivo, event: Event) {
    event.stopPropagation();
    this.editMode = true;
    this.selectedDevice = device;
    this.isSubmitting = false;
    this.newNombre = device.nombre;
    this.newTipo = device.tipo;
    this.newHabitacionId = device.habitacionId || null;
    this.newUbicacion = device.ubicacion;
    this.newCarga = device.carga;
    this.newModo = device.modo;
    this.showAddModal = true;
    device.showMenu = false;
  }

  closeModal() {
    this.showAddModal = false;
    this.isSubmitting = false;
  }

  /** Returns the ubicacion name for the selected habitacion */
  getHabitacionNombre(id: number | null): string {
    if (!id) return this.newUbicacion || 'Sin asignar';
    const hab = this.habitaciones.find(h => h.id === id);
    return hab ? hab.name : this.newUbicacion || 'Sin asignar';
  }

  addDevice() {
    // Prevent double-click: if already submitting, exit immediately
    if (this.isSubmitting) return;

    // Validate required fields
    const hasHabitacion = this.newHabitacionId !== null;
    if (!this.newNombre.trim() || !hasHabitacion || !this.newCarga.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Lock the form to prevent double submission
    this.isSubmitting = true;

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
      this.selectedDevice.ubicacion = this.getHabitacionNombre(this.newHabitacionId);
      this.selectedDevice.carga = powerStr;
      this.selectedDevice.modo = this.newModo;
      this.selectedDevice.icon = iconMap[this.newTipo] || 'other';
      if (this.newHabitacionId) {
        this.selectedDevice.habitacionId = this.newHabitacionId;
      }
      if (this.selectedDevice.estado) {
        this.selectedDevice.consumoHoy = estimatedKwh;
      }

      // Sync edit with backend
      if (this.selectedDevice.backendId && this.stateService.isBackendConnected) {
        this.apiService.updateDevice(this.selectedDevice.backendId, {
          nombre: this.newNombre,
          tipo: this.newTipo.toLowerCase(),
          automatico: this.newModo === 'AUTO',
          room_id: this.newHabitacionId || undefined,
        }).subscribe({
          next: () => {
            try {
              this.stateService.saveStateToStorage();
            } catch (e) {
              console.error('Error saving edited device state:', e);
            } finally {
              this.closeModal();
            }
          },
          error: (err) => {
            console.warn('Error updating device on backend:', err);
            try {
              this.stateService.saveStateToStorage();
            } catch (e) {
              console.error('Error saving edited device state in error handler:', e);
            } finally {
              this.closeModal();
            }
          }
        });
      } else {
        try {
          this.stateService.saveStateToStorage();
        } catch (e) {
          console.error('Error saving edited device state:', e);
        } finally {
          this.closeModal();
        }
      }
    } else {
      // ============ ADD NEW DEVICE ============
      // Determine habitacion_id: use selected dropdown or first available
      const habitacionId = this.newHabitacionId || this.stateService.selectedHabitacionId;

      if (this.stateService.isBackendConnected && habitacionId) {
        // Create on backend FIRST, then add to local state on success
        this.apiService.createDevice({
          habitacion_id: habitacionId,
          nombre: this.newNombre,
          tipo: this.newTipo.toLowerCase(),
          activo: true,
          automatico: this.newModo === 'AUTO',
        }).subscribe({
          next: (res) => {
            try {
              if (res.success && res.data) {
                // Map the backend response into the frontend model (single source of truth)
                const mappedDevice = this.stateService.mapDeviceFromBackend(res.data);
                // Avoid duplicates
                const alreadyExists = this.stateService.devices.some(
                  d => d.backendId === mappedDevice.backendId ||
                  (((d.nombre || '').trim().toLowerCase() === (mappedDevice.nombre || '').trim().toLowerCase()) &&
                   (d.ubicacion || '') === (mappedDevice.ubicacion || ''))
                );
                if (!alreadyExists) {
                  this.stateService.devices.push(mappedDevice);
                  this.stateService.saveStateToStorage();
                }
              }
            } catch (e) {
              console.error('Error handling success response:', e);
            } finally {
              this.closeModal();
            }
          },
          error: (err) => {
            console.error('Error creating device on backend:', err);
            try {
              // Fallback: add locally with temporary data
              const newDev: Dispositivo = {
                id: 'dev_' + Date.now(),
                nombre: this.newNombre,
                tipo: this.newTipo,
                ubicacion: this.getHabitacionNombre(habitacionId),
                carga: powerStr,
                estado: true,
                consumoHoy: estimatedKwh,
                modo: this.newModo,
                badge: 'EFICIENTE',
                badgeType: 'efficient',
                icon: iconMap[this.newTipo] || 'other',
                showMenu: false,
                habitacionId: habitacionId,
              };
              // Avoid duplicates
              const alreadyExists = this.stateService.devices.some(
                d => ((d.nombre || '').trim().toLowerCase() === (newDev.nombre || '').trim().toLowerCase()) &&
                (d.ubicacion || '') === (newDev.ubicacion || '')
              );
              if (!alreadyExists) {
                this.stateService.devices.push(newDev);
                this.stateService.saveStateToStorage();
              }
            } catch (e) {
              console.error('Error in fallback creation:', e);
            } finally {
              this.closeModal();
            }
          }
        });
      } else {
        // No backend connection: add locally only
        try {
          const newDev: Dispositivo = {
            id: 'dev_' + Date.now(),
            nombre: this.newNombre,
            tipo: this.newTipo,
            ubicacion: this.getHabitacionNombre(this.newHabitacionId),
            carga: powerStr,
            estado: true,
            consumoHoy: estimatedKwh,
            modo: this.newModo,
            badge: 'EFICIENTE',
            badgeType: 'efficient',
            icon: iconMap[this.newTipo] || 'other',
            showMenu: false,
            habitacionId: this.newHabitacionId || undefined,
          };
          // Avoid duplicates
          const alreadyExists = this.stateService.devices.some(
            d => ((d.nombre || '').trim().toLowerCase() === (newDev.nombre || '').trim().toLowerCase()) &&
            (d.ubicacion || '') === (newDev.ubicacion || '')
          );
          if (!alreadyExists) {
            this.stateService.devices.push(newDev);
            this.stateService.saveStateToStorage();
          }
        } catch (e) {
          console.error('Error in local creation:', e);
        } finally {
          this.closeModal();
        }
      }
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
