import { Injectable } from '@angular/core';

export interface Dispositivo {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: string;
  carga: string; // e.g. "60W"
  estado: boolean; // true = ACTIVO, false = INACTIVO
  consumoHoy: number; // in kWh
  modo: 'AUTO' | 'MANUAL';
  badge?: string;
  badgeType?: 'efficient' | 'eco' | 'constant' | 'standby' | 'off';
  icon?: string;
  showMenu?: boolean;
}

export interface Rutina {
  id: string;
  nombre: string;
  hora: string;
  periodo: 'AM' | 'PM';
  dias: string[];
  activa: boolean;
  estado: 'ACTIVA' | 'PAUSADA';
  acciones: AccionDispositivo[];
}

export interface AccionDispositivo {
  id: string;
  dispositivo: string;
  tipo: string;
  tipoAccion: 'ENCENDER' | 'APAGAR';
  icon: string;
}

export interface Alerta {
  id: string;
  tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO';
  titulo: string;
  descripcion: string;
  dispositivo: string;
  icono: string;
  fecha: string;
  hora: string;
  leida: boolean;
  activa: boolean;
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

@Injectable({
  providedIn: 'root'
})
export class StateService {
  sidebarMinimized = false;
  toasts: { id: string; tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO'; titulo: string; descripcion: string }[] = [];

  usuario = {
    nombre: 'Daniel Specter',
    email: 'daniel.specter@ecovolt.com',
    telefono: '+57 314 567 8901',
    ciudad: 'Bogotá, Colombia',
    plan: 'EcoVolt Pro',
    miembro: 'Junio 2024',
    avatar: null as string | null,
  };

  devices: Dispositivo[] = [];
  routines: Rutina[] = [];
  alertas: Alerta[] = [];
  activities: Actividad[] = [];
  notificationsList: NotificationItem[] = [];

  // Hogar Virtual
  hogar = {
    nombrePropiedad: 'Casa San Isidro',
    ubicacion: 'Bogotá, Colombia',
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

  constructor() {
    this.loadState();
    this.startAlertSimulation();
  }

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
        this.usuario = data.usuario;
        this.devices = data.devices;
        this.routines = data.routines;
        this.alertas = data.alertas;
        this.activities = data.activities;
        this.hogar = data.hogar;
        this.energia = data.energia;
        this.apariencia = data.apariencia;
        this.notificaciones = data.notificaciones;
        this.integracion = data.integracion;
        this.tarifa = data.tarifa;
        this.ecoIA = data.ecoIA;
        this.notificationsList = data.notificationsList || [
          { id: '1', texto: '¡Bienvenido a EcoVolt! Comienza a gestionar inteligentemente tu consumo de energía.', leido: false, tiempo: 'Ahora' }
        ];
        return;
      } catch (e) {
        console.error('Error loading saved state', e);
      }
    }

    // Default initialization if no state was found in storage
    if (this.isTestUser()) {
      this.usuario = {
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
      // Standard Populated Demo User
      this.usuario = {
        nombre: 'Daniel Specter',
        email: 'daniel.specter@ecovolt.com',
        telefono: '+57 314 567 8901',
        ciudad: 'Bogotá, Colombia',
        plan: 'EcoVolt Pro',
        miembro: 'Junio 2024',
        avatar: null,
      };
      this.hogar.nombrePropiedad = 'Casa San Isidro';
      this.hogar.ubicacion = 'Bogotá, Colombia';
      
      this.devices = [
        { id: '1', nombre: 'Lámpara sala', tipo: 'Luz', ubicacion: 'Sala', carga: '60W', estado: true, consumoHoy: 0.3, modo: 'AUTO', badge: 'EFICIENTE', badgeType: 'efficient', icon: 'lamp' },
        { id: '2', nombre: 'Smart TV', tipo: 'TV', ubicacion: 'Sala', carga: '120W', estado: true, consumoHoy: 0.8, modo: 'MANUAL', badge: 'EFICIENTE', badgeType: 'efficient', icon: 'tv' },
        { id: '3', nombre: 'Refrigerador', tipo: 'Refrigerador', ubicacion: 'Cocina', carga: '200W', estado: true, consumoHoy: 2.1, modo: 'AUTO', badge: 'CONSTANTE', badgeType: 'constant', icon: 'fridge' },
        { id: '4', nombre: 'Aire Acond.', tipo: 'AC', ubicacion: 'Dormitorio', carga: '1500W', estado: false, consumoHoy: 0, modo: 'AUTO', badge: 'STANDBY', badgeType: 'standby', icon: 'ac' },
        { id: '5', nombre: 'Lavadora', tipo: 'Lavadora', ubicacion: 'Lavandería', carga: '800W', estado: false, consumoHoy: 0, modo: 'MANUAL', badge: 'OFF', badgeType: 'off', icon: 'washer' }
      ];

      this.routines = [
        {
          id: '1',
          nombre: 'Rutina Mañana',
          hora: '06:30',
          periodo: 'AM',
          dias: ['L', 'M', 'X', 'J', 'V'],
          activa: true,
          estado: 'ACTIVA',
          acciones: [
            { id: 'a1', dispositivo: 'Lámpara Sala', tipo: 'ILUMINACIÓN INTELIGENTE', tipoAccion: 'ENCENDER', icon: 'lamp' },
            { id: 'a2', dispositivo: 'Cafetera', tipo: 'ELECTRODOMÉSTICO', tipoAccion: 'ENCENDER', icon: 'coffee' },
            { id: 'a3', dispositivo: 'TV Sala', tipo: 'ENTRETENIMIENTO', tipoAccion: 'APAGAR', icon: 'tv' }
          ]
        },
        {
          id: '2',
          nombre: 'Modo Noche',
          hora: '11:00',
          periodo: 'PM',
          dias: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
          activa: true,
          estado: 'ACTIVA',
          acciones: [
            { id: 'b1', dispositivo: 'Lámpara Sala', tipo: 'ILUMINACIÓN INTELIGENTE', tipoAccion: 'APAGAR', icon: 'lamp' },
            { id: 'b2', dispositivo: 'TV Sala', tipo: 'ENTRETENIMIENTO', tipoAccion: 'APAGAR', icon: 'tv' }
          ]
        },
        {
          id: '3',
          nombre: 'Fin de semana',
          hora: '09:00',
          periodo: 'AM',
          dias: ['S', 'D'],
          activa: false,
          estado: 'PAUSADA',
          acciones: [
            { id: 'c1', dispositivo: 'Cafetera', tipo: 'ELECTRODOMÉSTICO', tipoAccion: 'ENCENDER', icon: 'coffee' }
          ]
        }
      ];

      this.alertas = [
        {
          id: '1',
          tipo: 'CRITICA',
          titulo: 'Consumo Excesivo Detectado',
          descripcion: 'El aire acondicionado ha superado el umbral de consumo diario permitido (15 kWh). Se recomienda reducir la temperatura o apagar el dispositivo.',
          dispositivo: 'Aire Acondicionado Sala',
          icono: 'ac',
          fecha: 'Hoy',
          hora: '14:32',
          leida: false,
          activa: true
        },
        {
          id: '2',
          tipo: 'ADVERTENCIA',
          titulo: 'Dispositivo sin respuesta',
          descripcion: 'La lavadora no responde a los comandos enviados en los últimos 10 minutos. Verifique la conexión de red o el estado físico del dispositivo.',
          dispositivo: 'Lavadora Samsung',
          icono: 'washer',
          fecha: 'Hoy',
          hora: '12:15',
          leida: false,
          activa: true
        },
        {
          id: '3',
          tipo: 'INFO',
          titulo: 'Rutina ejecutada exitosamente',
          descripcion: 'La rutina "Modo Noche" se ejecutó correctamente a las 11:00 PM. Todos los dispositivos fueron apagados según la programación.',
          dispositivo: 'Sistema de Rutinas',
          icono: 'routine',
          fecha: 'Hoy',
          hora: '11:00',
          leida: true,
          activa: false
        },
        {
          id: '4',
          tipo: 'ADVERTENCIA',
          titulo: 'Batería de respaldo baja',
          descripcion: 'El sistema de batería solar tiene un nivel inferior al 20%. Si el consumo continúa, el sistema cambiará a red eléctrica en las próximas horas.',
          dispositivo: 'Panel Solar EcoVolt',
          icono: 'solar',
          fecha: 'Ayer',
          hora: '09:45',
          leida: true,
          activa: false
        },
        {
          id: '5',
          tipo: 'CRITICA',
          titulo: 'Pico de voltaje detectado',
          descripcion: 'Se detectó un pico de voltaje de 250V en el circuito principal. El dispositivo de protección se activó automáticamente para prevenir daños.',
          dispositivo: 'Circuito Principal',
          icono: 'lightning',
          fecha: 'Ayer',
          hora: '03:22',
          leida: true,
          activa: false
        }
      ];

      this.activities = [
        { texto: 'Aire Acondicionado encendido', tiempo: 'Hace 12 min', subtitulo: 'Rutina Noche', dotType: 'active' },
        { texto: 'TV Sala apagada', tiempo: 'Hace 45 min', subtitulo: 'Control Remoto', dotType: 'inactive' },
        { texto: 'Pico de consumo detectado', tiempo: 'Hoy, 14:30', subtitulo: 'Lavandería', dotType: 'alert' }
      ];

      this.notificationsList = [
        { id: '1', texto: '¡Bienvenido a EcoVolt! Comienza a gestionar inteligentemente tu consumo de energía.', leido: false, tiempo: 'Ahora' }
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
      notificationsList: this.notificationsList
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  saveProfile(updatedUsuario: any) {
    this.usuario = { ...updatedUsuario };
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

  startAlertSimulation() {
    // Run alert check every 30 seconds
    setInterval(() => {
      const email = localStorage.getItem('currentUserEmail');
      if (!email) return;

      // 35% chance to trigger a new alert every 30s
      if (Math.random() < 0.35) {
        this.generateSimulatedAlert();
      }
    }, 30000);
  }

  generateSimulatedAlert() {
    const alertTemplates = [
      {
        tipo: 'CRITICA' as const,
        titulo: 'Pico de Consumo en Cocina',
        descripcion: 'El horno microondas o freidora ha superado el tiempo de uso normal. Se recomienda apagarlo para reducir consumo.',
        dispositivo: 'Cocina Inteligente',
        icono: 'lightning'
      },
      {
        tipo: 'ADVERTENCIA' as const,
        titulo: 'Filtro de AC Obstruido',
        descripcion: 'El flujo de aire del Aire Acondicionado es deficiente. Se sugiere realizar mantenimiento preventivo.',
        dispositivo: 'Aire Acondicionado Dormitorio',
        icono: 'thermostat'
      },
      {
        tipo: 'INFO' as const,
        titulo: 'Modo Ahorro Exitoso',
        descripcion: 'La rutina de Modo Noche se ha ejecutado y redujo el consumo nocturno en un 15%.',
        dispositivo: 'Eco-IA Optimizer',
        icono: 'leaf'
      },
      {
        tipo: 'ADVERTENCIA' as const,
        titulo: 'Uso Inusual de Smart TV',
        descripcion: 'La TV de la Sala lleva encendida más de 5 horas. ¿Olvidaste apagarla?',
        dispositivo: 'Smart TV',
        icono: 'tv'
      },
      {
        tipo: 'CRITICA' as const,
        titulo: 'Fluctuación de Voltaje',
        descripcion: 'Se registró una variación de voltaje de 240V en la red. El supresor de picos EcoVolt protegió tus equipos.',
        dispositivo: 'Tablero Principal',
        icono: 'lightning'
      }
    ];

    const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
    const date = new Date();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newAlert = {
      id: 'alert_' + Date.now(),
      tipo: template.tipo,
      titulo: template.titulo,
      descripcion: template.descripcion,
      dispositivo: template.dispositivo,
      icono: template.icono,
      fecha: 'Hoy',
      hora: timeStr,
      leida: false,
      activa: true
    };

    this.alertas.unshift(newAlert);
    if (this.alertas.length > 15) {
      this.alertas.pop();
    }

    // Also push a system notification
    this.addNotification(`${template.tipo === 'CRITICA' ? '🚨 ALERTA CRÍTICA' : template.tipo === 'ADVERTENCIA' ? '⚠️ ADVERTENCIA' : 'ℹ️ INFO'}: ${template.titulo}`);
    
    this.showToast(newAlert.tipo, newAlert.titulo, newAlert.descripcion);
    
    this.saveStateToStorage();
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
}
