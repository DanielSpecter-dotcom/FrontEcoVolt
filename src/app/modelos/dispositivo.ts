/**
 * Objeto de transferencia de un dispositivo IoT tal como lo retorna el backend.
 * Contiene información técnica, estado actual y ubicación.
 */
export interface DispositivoDTO {
  id: number;
  nombre: string;
  tipo: string;
  /** Potencia nominal del dispositivo en watts */
  potencia_watts: number;
  /** Límite de consumo configurado en kWh */
  limite_kwh: number;
  /** Estado actual: 'ACTIVO', 'INACTIVO', etc. */
  status: string;
  /** Modo de operación: 'AUTO', 'MANUAL' */
  mode: string;
  habitacion_id: number;
  habitacion_nombre: string;
}

/**
 * DTO para crear un nuevo dispositivo.
 * Se envía al endpoint POST de dispositivos.
 */
export interface CrearDispositivoDTO {
  /** ID de la habitación donde se instala (alias: room_id) */
  habitacion_id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
  automatico: boolean;
  limite_kwh?: number;
}

/**
 * DTO para actualizar un dispositivo existente.
 * Se envía al endpoint PUT de dispositivos.
 */
export interface ActualizarDispositivoDTO {
  nombre: string;
  tipo: string;
  activo?: boolean;
  automatico?: boolean;
  limite_kwh?: number;
  room_id?: number;
}

/**
 * Modelo de dispositivo enriquecido para uso en componentes del frontend.
 * Extiende los datos del backend con propiedades de presentación.
 */
export interface Dispositivo {
  /** ID interno del frontend (puede ser UUID) */
  id: string;
  /** ID del dispositivo en el backend */
  backendId?: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  /** Nivel de carga/consumo descriptivo */
  carga: string;
  estado: boolean;
  /** Consumo acumulado del día en kWh */
  consumoHoy: number;
  modo: 'AUTO' | 'MANUAL';
  /** Etiqueta de eficiencia (e.g., 'Eco', 'Eficiente') */
  badge?: string;
  /** Tipo visual de la etiqueta */
  badgeType?: 'efficient' | 'eco' | 'constant' | 'standby' | 'off';
  /** Clase CSS o nombre del icono */
  icon?: string;
  /** Controla la visibilidad del menú contextual en la UI */
  showMenu?: boolean;
  habitacionId?: number;
  limiteKwh?: number;
}
