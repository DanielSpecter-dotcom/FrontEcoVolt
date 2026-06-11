/**
 * Acción sobre un dispositivo dentro de una rutina (modelo frontend).
 * Incluye información visual para la UI.
 */
export interface AccionDispositivo {
  id: string;
  /** Nombre del dispositivo objetivo */
  dispositivo: string;
  /** Tipo del dispositivo (e.g., 'Luz', 'Ventilador') */
  tipo: string;
  tipoAccion: 'ENCENDER' | 'APAGAR';
  /** Icono representativo del dispositivo */
  icon: string;
  /** ID del dispositivo en el backend */
  deviceId?: number;
}

/**
 * Acción individual dentro de una rutina.
 * Define si un dispositivo debe encenderse o apagarse.
 */
export interface RutinaAccionDTO {
  device_id: number;
  /** true = encender, false = apagar */
  turn_on: boolean;
}

/**
 * Rutina programada que ejecuta acciones sobre dispositivos
 * en horarios y días específicos.
 */
export interface RutinaDTO {
  id: number;
  home_id: number;
  name: string;
  /** Hora de ejecución en formato HH:mm */
  execution_time: string;
  /** Días de la semana en que se ejecuta (e.g., ['MONDAY', 'FRIDAY']) */
  days_of_week: string[];
  /** Acciones a ejecutar sobre dispositivos */
  actions: RutinaAccionDTO[];
  /** Indica si la rutina está habilitada */
  enabled: boolean;
  /** Indica si fue pausada automáticamente por el modo ausente */
  paused_by_away_mode: boolean;
}

/**
 * Respuesta del modo ausente (Away Mode).
 * Indica el estado del modo y cuántas rutinas fueron pausadas.
 */
export interface AwayModeResponse {
  home_id: number;
  away_mode_enabled: boolean;
  /** Cantidad de rutinas pausadas por el modo ausente */
  paused_routines: number;
}

/**
 * Modelo de rutina enriquecido para uso en componentes del frontend.
 * Combina datos del backend con formato de presentación.
 */
export interface Rutina {
  /** ID interno del frontend (puede ser UUID) */
  id: string;
  /** ID de la rutina en el backend */
  backendId?: number;
  homeId?: number;
  nombre: string;
  /** Hora en formato de 12 horas (sin AM/PM) */
  hora: string;
  periodo: 'AM' | 'PM';
  /** Días de la semana abreviados (e.g., ['Lun', 'Mar']) */
  dias: string[];
  activa: boolean;
  estado: 'ACTIVA' | 'PAUSADA';
  acciones: AccionDispositivo[];
  /** Indica si fue pausada por el modo ausente */
  pausadaPorAusencia?: boolean;
}
