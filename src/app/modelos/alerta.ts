/**
 * Alerta generada por el sistema para un dispositivo.
 * Puede ser por consumo excesivo, uso prolongado, etc.
 */
export interface AlertaDTO {
  id: number;
  /** Tipo de alerta: 'CRITICA', 'ADVERTENCIA', 'INFO' */
  tipo: string;
  mensaje: string;
  /** Indica si el usuario ya leyó la alerta */
  leido: boolean;
  /** Fecha y hora de creación (ISO 8601) */
  fecha_creacion: string;
  device_id: number;
  device_name: string;
}

/**
 * Respuesta del endpoint de límites de consumo.
 * Representa el límite configurado para un dispositivo.
 */
export interface LimiteRespuestaDto {
  device_id: number;
  device_name: string;
  /** Límite de consumo en kWh */
  limit_kwh: number;
}

/**
 * Modelo de alerta enriquecido para uso en componentes del frontend.
 * Incluye campos de presentación como icono y estado visual.
 */
export interface Alerta {
  /** ID interno del frontend (puede ser UUID) */
  id: string;
  /** ID de la alerta en el backend */
  backendId?: number;
  tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO';
  titulo: string;
  descripcion: string;
  /** Nombre del dispositivo asociado */
  dispositivo: string;
  /** Icono representativo del tipo de alerta */
  icono: string;
  /** Fecha formateada para mostrar */
  fecha: string;
  /** Hora formateada para mostrar */
  hora: string;
  leida: boolean;
  activa: boolean;
  /** ID del dispositivo en el backend */
  deviceId?: number;
}
