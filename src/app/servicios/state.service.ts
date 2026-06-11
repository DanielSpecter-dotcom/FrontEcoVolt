import { Injectable } from '@angular/core';
import { ApiService, UsuarioDTO, DispositivoDTO, AlertaDTO as BackendAlertaDTO, RutinaDTO, CasaDTO, HabitacionDTO } from './api.service';
import { AuthService } from './auth.service';
import { forkJoin } from 'rxjs';

// ==================== Frontend Interfaces ====================
// These map backend DTOs to the shapes components already use

export interface Dispositivo {
  id: string;
  backendId?: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  carga: string;
  estado: boolean;
  consumoHoy: number;
  modo: 'AUTO' | 'MANUAL';
  badge?: string;
  badgeType?: 'efficient' | 'eco' | 'constant' | 'standby' | 'off';
  icon?: string;
  showMenu?: boolean;
  habitacionId?: number;
  limiteKwh?: number;
}

export interface Rutina {
  id: string;
  backendId?: number;
  homeId?: number;
  nombre: string;
  hora: string;
  periodo: 'AM' | 'PM';
  dias: string[];
  activa: boolean;
  estado: 'ACTIVA' | 'PAUSADA';
  acciones: AccionDispositivo[];
  pausadaPorAusencia?: boolean;
}

export interface AccionDispositivo {
  id: string;
  dispositivo: string;
  tipo: string;
  tipoAccion: 'ENCENDER' | 'APAGAR';
  icon: string;
  deviceId?: number;
}

export interface Alerta {
  id: string;
  backendId?: number;
  tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO';
  titulo: string;
  descripcion: string;
  dispositivo: string;
  icono: string;
  fecha: string;
  hora: string;
  leida: boolean;
  activa: boolean;
  deviceId?: number;
}

export interface Actividad {
  texto: string;
  tiempo: string;
  subtitulo: string;
  dotType: 'active' | 'inactive' | 'alert' | 'system';
}

export interface NotificationItem {
  id: string;
  texto: string;
  leido: boolean;
  tiempo: string;
}

// ==================== State Service ====================

@Injectable({
  providedIn: 'root'
})
export class StateService {
  sidebarMinimized = false;
  toasts: { id: string; tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO'; titulo: string; descripcion: string }[] = [];

  // Flags
  isLoading = false;
  isBackendConnected = false;
  userId: number | null = null;
  userRole: string = 'PERSONAL';

  usuario = {
    nombre: 'Usuario',
    email: '',
    telefono: '',
    ciudad: 'Lima, Perú',
    plan: 'EcoVolt Personal',
    miembro: '',
    avatar: null as string | null,
    apellido: '',
    username: '',
    tipoUsuario: 'PERSONAL',
  };

  devices: Dispositivo[] = [];
  routines: Rutina[] = [];
  alertas: Alerta[] = [];
  activities: Actividad[] = [];
  notificationsList: NotificationItem[] = [];

  // Casas & Habitaciones from backend
  casas: CasaDTO[] = [];
  habitaciones: HabitacionDTO[] = [];

  // Hogar Virtual
  hogar = {
    nombrePropiedad: 'Mi Hogar',
    ubicacion: 'Lima, Perú',
    tipoPropiedad: 'CASA',
    metrosCuadrados: 120,
  };

  // Preferencias de Energía
  energia = {
    moneda: 'SOLES',
    unidad: 'KWH',
    limiteConsumodiario: 15,
    limiteConsumomensual: 350,
    presupuestomensual: 180,
  };

  // Apariencia
  apariencia = {
    tema: 'CLARO',
    idioma: 'ES',
    zonaHoraria: 'America/Lima',
  };

  // Notificaciones Settings
  notificaciones = {
    consumoCritico: true,
    reporteMensual: true,
    mantenimiento: false,
    alertasSeguridad: true,
    recordatoriosRutina: false,
  };

  // Integración
  integracion = {
    googleHome: false,
    alexa: false,
    smartThings: false,
  };

  // Tarifas de Energía
  tarifa = {
    tipoTarifa: 'FLEXIBLE',
    costoKwhBase: 0.48,
    costoKwhPico: 0.75,
    horaPuntaInicio: '18:00',
    horaPuntaFin: '23:00',
  };

  // Asistente Eco-IA
  ecoIA = {
    sugerenciasActivas: true,
    frecuenciaConsejos: 'DIARIO',
    autoApagadoEco: true,
    umbralAhorroObjetivo: 15,
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.loadState();
  }

  // ==================== Load from Backend ====================

  /**
   * Loads all user data from the backend.
   * Called after login or when entering a protected route.
   * Falls back to demo/localStorage data if backend is unavailable.
   */
  loadFromBackend(): Promise<boolean> {
    this.isLoading = true;

    return new Promise((resolve) => {
      // First: get the user profile
      this.apiService.getMe().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.isBackendConnected = true;
            this.mapUserFromBackend(res.data);
            this.authService.setUserId(res.data.id);
            this.userId = res.data.id;
            this.userRole = res.data.tipo_usuario || this.authService.getUserRole();

            // Now load everything else in parallel
            this.loadAllData().then(() => {
              this.isLoading = false;
              this.saveStateToStorage();
              resolve(true);
            });
          } else {
            console.warn('Backend /me returned unsuccessful, using fallback');
            this.isLoading = false;
            this.loadState();
            resolve(false);
          }
        },
        error: (err) => {
          console.warn('Backend not reachable, using fallback data:', err.message);
          this.isBackendConnected = false;
          this.isLoading = false;
          this.loadState();
          resolve(false);
        }
      });
    });
  }

  private loadAllData(): Promise<void> {
    return new Promise((resolve) => {
      forkJoin({
        devices: this.apiService.getDevices(),
        routines: this.apiService.getRoutines(),
        alerts: this.apiService.getAlertHistory(),
        homes: this.apiService.getHomes(),
        rooms: this.apiService.getRooms(),
      }).subscribe({
        next: (results) => {
          // Map devices
          if (results.devices.success && results.devices.data) {
            this.devices = results.devices.data.map(d => this.mapDeviceFromBackend(d));
          }

          // Map routines
          if (results.routines.success && results.routines.data) {
            this.routines = results.routines.data.map(r => this.mapRoutineFromBackend(r));
          }

          // Map alerts
          if (results.alerts.success && results.alerts.data) {
            this.alertas = results.alerts.data.map(a => this.mapAlertFromBackend(a));
          }

          // Store homes and rooms
          if (results.homes.success && results.homes.data) {
            this.casas = results.homes.data;
            // Set hogar from the first home if available
            if (this.casas.length > 0) {
              this.hogar.nombrePropiedad = this.casas[0].nombre;
            }
          }

          if (results.rooms.success && results.rooms.data) {
            this.habitaciones = results.rooms.data;
          }

          this.notificationsList = [
            { id: '1', texto: '¡Bienvenido a EcoVolt! Datos cargados desde el servidor.', leido: false, tiempo: 'Ahora' }
          ];

          resolve();
        },
        error: (err) => {
          console.warn('Error loading data from backend:', err);
          resolve(); // resolve anyway so the app doesn't hang
        }
      });
    });
  }

  // ==================== Backend → Frontend Mappers ====================

  private mapUserFromBackend(dto: UsuarioDTO): void {
    const fullName = [dto.nombre, dto.apellido].filter(Boolean).join(' ') || 'Usuario';
    this.usuario = {
      nombre: fullName,
      email: dto.correo,
      telefono: '',
      ciudad: 'Lima, Perú',
      plan: dto.tipo_usuario === 'EMPRESARIAL' ? 'EcoVolt Empresarial' : 'EcoVolt Personal',
      miembro: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      avatar: null,
      apellido: dto.apellido || '',
      username: dto.username || '',
      tipoUsuario: dto.tipo_usuario || 'PERSONAL',
    };
    this.userRole = dto.tipo_usuario || 'PERSONAL';

    // Map notification settings
    this.notificaciones.consumoCritico = dto.consumo_excesivo ?? true;
    this.notificaciones.reporteMensual = dto.reporte_semanal ?? true;
  }

  public mapDeviceFromBackend(dto: DispositivoDTO): Dispositivo {
    const isOn = dto.status === 'ON';
    const isAuto = dto.mode === 'AUTOMATIC';

    const iconMap: { [key: string]: string } = {
      'luz': 'lamp', 'lampara': 'lamp', 'iluminacion': 'lamp',
      'tv': 'tv', 'television': 'tv',
      'refrigerador': 'fridge', 'refrigeradora': 'fridge', 'nevera': 'fridge',
      'ac': 'ac', 'aire': 'ac', 'aire acondicionado': 'ac',
      'lavadora': 'washer',
      'cafetera': 'coffee',
      'microondas': 'other', 'horno': 'other',
    };
    const tipoLower = (dto.tipo || '').toLowerCase();
    const icon = iconMap[tipoLower] || 'other';

    let badge = isOn ? 'ACTIVO' : 'OFF';
    let badgeType: 'efficient' | 'eco' | 'constant' | 'standby' | 'off' = isOn ? 'efficient' : 'off';

    return {
      id: dto.id.toString(),
      backendId: dto.id,
      nombre: dto.nombre,
      tipo: dto.tipo,
      ubicacion: dto.habitacion_nombre || 'Sin asignar',
      carga: `${dto.potencia_watts || 0}W`,
      estado: isOn,
      consumoHoy: 0, // Will be filled by consumption endpoints
      modo: isAuto ? 'AUTO' : 'MANUAL',
      badge,
      badgeType,
      icon,
      showMenu: false,
      habitacionId: dto.habitacion_id,
      limiteKwh: dto.limite_kwh,
    };
  }

  public mapRoutineFromBackend(dto: RutinaDTO): Rutina {
    // Map backend day names to frontend abbreviations
    const dayMap: { [key: string]: string } = {
      'MONDAY': 'L', 'TUESDAY': 'M', 'WEDNESDAY': 'X',
      'THURSDAY': 'J', 'FRIDAY': 'V', 'SATURDAY': 'S', 'SUNDAY': 'D'
    };

    const dias = (dto.days_of_week || []).map(d => dayMap[d] || d);

    // Parse execution_time "HH:mm" to hora + periodo
    let hora = dto.execution_time || '12:00';
    let periodo: 'AM' | 'PM' = 'AM';
    if (hora) {
      const [h, m] = hora.split(':').map(Number);
      if (h >= 12) {
        periodo = 'PM';
        hora = `${h === 12 ? 12 : h - 12}:${m.toString().padStart(2, '0')}`;
      } else {
        hora = `${h === 0 ? 12 : h}:${m.toString().padStart(2, '0')}`;
      }
    }

    const acciones: AccionDispositivo[] = (dto.actions || []).map((a, idx) => ({
      id: `act_${dto.id}_${idx}`,
      dispositivo: `Dispositivo ${a.device_id}`,
      tipo: '',
      tipoAccion: a.turn_on ? 'ENCENDER' as const : 'APAGAR' as const,
      icon: 'other',
      deviceId: a.device_id,
    }));

    // Enrich action names with device info
    acciones.forEach(acc => {
      const dev = this.devices.find(d => d.backendId === acc.deviceId);
      if (dev) {
        acc.dispositivo = dev.nombre;
        acc.tipo = dev.tipo.toUpperCase();
        acc.icon = dev.icon || 'other';
      }
    });

    return {
      id: dto.id.toString(),
      backendId: dto.id,
      homeId: dto.home_id,
      nombre: dto.name,
      hora,
      periodo,
      dias,
      activa: dto.enabled,
      estado: dto.enabled ? 'ACTIVA' : 'PAUSADA',
      acciones,
      pausadaPorAusencia: dto.paused_by_away_mode,
    };
  }

  public mapAlertFromBackend(dto: BackendAlertaDTO): Alerta {
    // Map tipo to frontend's expected format
    let tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO' = 'INFO';
    const backendTipo = (dto.tipo || '').toUpperCase();
    if (backendTipo.includes('CRIT') || backendTipo.includes('CRITICA')) tipo = 'CRITICA';
    else if (backendTipo.includes('ADVERT') || backendTipo.includes('WARNING')) tipo = 'ADVERTENCIA';

    // Parse fecha_creacion
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

  // ==================== Local State (fallback & backward compat) ====================

  isTestUser(): boolean {
    const email = localStorage.getItem('currentUserEmail');
    return !!email && (email.toLowerCase() === 'pruebas@ecovolt.com' || email.toLowerCase().includes('pruebas'));
  }

  loadState() {
    this.sidebarMinimized = localStorage.getItem('ecovolt_sidebar_minimized') === 'true';
    const email = localStorage.getItem('currentUserEmail');
    if (!email) return;

    const storageKey = 'ecovolt_state_' + email.toLowerCase();
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.usuario) this.usuario = { ...this.usuario, ...data.usuario };
        if (data.devices) this.devices = data.devices;
        if (data.routines) this.routines = data.routines;
        if (data.alertas) this.alertas = data.alertas;
        if (data.activities) this.activities = data.activities;
        if (data.hogar) this.hogar = data.hogar;
        if (data.energia) this.energia = data.energia;
        if (data.apariencia) this.apariencia = data.apariencia;
        if (data.notificaciones) this.notificaciones = data.notificaciones;
        if (data.integracion) this.integracion = data.integracion;
        if (data.tarifa) this.tarifa = data.tarifa;
        if (data.ecoIA) this.ecoIA = data.ecoIA;
        this.notificationsList = data.notificationsList || [
          { id: '1', texto: '¡Bienvenido a EcoVolt! Comienza a gestionar inteligentemente tu consumo de energía.', leido: false, tiempo: 'Ahora' }
        ];
        if (data.userId) this.userId = data.userId;
        if (data.userRole) this.userRole = data.userRole;
        if (data.casas) this.casas = data.casas;
        if (data.habitaciones) this.habitaciones = data.habitaciones;
        return;
      } catch (e) {
        console.error('Error loading saved state', e);
      }
    }

    // Default initialization if no state was found in storage
    this.initializeDefaults(email);
  }

  private initializeDefaults(email: string) {
    if (this.isTestUser()) {
      this.usuario = {
        ...this.usuario,
        nombre: 'Usuario Pruebas',
        email: 'pruebas@ecovolt.com',
        telefono: '+51 999 888 777',
        ciudad: 'Lima, Perú',
        plan: 'Plan Demo Pruebas',
        miembro: 'Junio 2026',
        avatar: null,
      };
      this.hogar.nombrePropiedad = 'Hogar Virtual Pruebas';
      this.hogar.ubicacion = 'Lima, Perú';
      this.devices = [];
      this.routines = [];
      this.alertas = [];
      this.activities = [];
      this.notificationsList = [
        { id: '1', texto: '¡Bienvenido a EcoVolt! Comienza a gestionar inteligentemente tu consumo de energía.', leido: false, tiempo: 'Ahora' }
      ];
    } else {
      this.usuario = {
        ...this.usuario,
        nombre: 'Usuario',
        email: email,
        telefono: '',
        ciudad: 'Lima, Perú',
        plan: 'EcoVolt Personal',
        miembro: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        avatar: null,
      };
      this.devices = [];
      this.routines = [];
      this.alertas = [];
      this.activities = [];
      this.notificationsList = [
        { id: '1', texto: '¡Bienvenido a EcoVolt! Conectando con el servidor...', leido: false, tiempo: 'Ahora' }
      ];
    }

    this.saveStateToStorage();
  }

  saveStateToStorage() {
    const email = localStorage.getItem('currentUserEmail');
    if (!email) return;

    const storageKey = 'ecovolt_state_' + email.toLowerCase();
    const data = {
      usuario: this.usuario,
      devices: this.devices,
      routines: this.routines,
      alertas: this.alertas,
      activities: this.activities,
      hogar: this.hogar,
      energia: this.energia,
      apariencia: this.apariencia,
      notificaciones: this.notificaciones,
      integracion: this.integracion,
      tarifa: this.tarifa,
      ecoIA: this.ecoIA,
      notificationsList: this.notificationsList,
      userId: this.userId,
      userRole: this.userRole,
      casas: this.casas,
      habitaciones: this.habitaciones,
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  saveProfile(updatedUsuario: any) {
    this.usuario = { ...this.usuario, ...updatedUsuario };
    this.hogar.ubicacion = this.usuario.ciudad;
    this.saveStateToStorage();
  }

  addNotification(texto: string) {
    this.notificationsList.unshift({
      id: 'not_' + Date.now(),
      texto,
      leido: false,
      tiempo: 'Hace un momento'
    });
    this.saveStateToStorage();
  }

  toggleSidebar() {
    this.sidebarMinimized = !this.sidebarMinimized;
    localStorage.setItem('ecovolt_sidebar_minimized', String(this.sidebarMinimized));
  }

  showToast(tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO', titulo: string, descripcion: string) {
    const id = 'toast_' + Date.now();
    this.toasts.push({ id, tipo, titulo, descripcion });
    setTimeout(() => {
      this.removeToast(id);
    }, 6000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // ==================== Utility: Day Mapping ====================

  /** Converts frontend day abbreviation to backend enum */
  static dayToBackend(day: string): string {
    const map: { [key: string]: string } = {
      'L': 'MONDAY', 'M': 'TUESDAY', 'X': 'WEDNESDAY',
      'J': 'THURSDAY', 'V': 'FRIDAY', 'S': 'SATURDAY', 'D': 'SUNDAY'
    };
    return map[day] || day;
  }

  /** Converts backend day enum to frontend abbreviation */
  static dayToFrontend(day: string): string {
    const map: { [key: string]: string } = {
      'MONDAY': 'L', 'TUESDAY': 'M', 'WEDNESDAY': 'X',
      'THURSDAY': 'J', 'FRIDAY': 'V', 'SATURDAY': 'S', 'SUNDAY': 'D'
    };
    return map[day] || day;
  }
}
