/**
 * Resumen general del panel principal.
 * Muestra métricas clave de consumo y costo.
 */
export interface ResumenPanelDto {
  /** Consumo acumulado del día en kWh */
  consumoDiarioKwh: number;
  /** Consumo acumulado del mes en kWh */
  consumoMensualKwh: number;
  /** Costo estimado en soles (S/.) */
  costoEstimadoSoles: number;
  /** Variación porcentual respecto al período anterior */
  variacionPorcentaje: number;
}

/**
 * Dispositivo simplificado para visualización en el panel.
 */
export interface DispositivoPanelDto {
  id: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  /** Estado legible: 'Encendido', 'Apagado', etc. */
  estado: string;
  activo: boolean;
}

/**
 * Ítem genérico del panel que puede representar una escena o rutina.
 */
export interface PanelItemDto {
  id: number;
  nombre: string;
  tipo: string;
  estado: string;
}

/**
 * Agrupación de escenas y rutinas para el panel principal.
 */
export interface EscenasRutinasPanelDto {
  escenas: PanelItemDto[];
  rutinas: PanelItemDto[];
}

/**
 * Registro de actividad reciente mostrado en el panel.
 */
export interface ActividadPanelDto {
  /** Hora de la actividad (e.g., '14:30') */
  hora: string;
  descripcion: string;
  /** Tipo de actividad para iconografía */
  tipo: string;
}

/**
 * Registro de actividad reciente para la línea de tiempo del frontend.
 */
export interface Actividad {
  texto: string;
  /** Tiempo transcurrido relativo (e.g., 'Hace 5 min') */
  tiempo: string;
  subtitulo: string;
  /** Tipo visual del punto en la línea de tiempo */
  dotType: 'active' | 'inactive' | 'alert' | 'system';
}

/**
 * Ítem de notificación para el centro de notificaciones del frontend.
 */
export interface NotificationItem {
  id: string;
  texto: string;
  leido: boolean;
  /** Tiempo transcurrido relativo (e.g., 'Hace 2 min') */
  tiempo: string;
}
