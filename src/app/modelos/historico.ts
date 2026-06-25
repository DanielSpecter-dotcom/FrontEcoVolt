/**
 * Registro histórico de consumo de un dispositivo.
 * Cada entrada representa una medición en un momento dado.
 */
export interface HistoricoDTO {
  id: number;
  /** Fecha y hora de la medición (ISO 8601) */
  fecha_registro: string;
  /** Energía consumida en kilovatios-hora */
  kwh_consumidos: number;
  /** Duración de uso en minutos */
  duracion_minutos: number;
  dispositivo_id: number;
  dispositivo_nombre: string;
}

/**
 * Ítem individual de comparación de consumo entre dispositivos.
 * Usado en gráficas comparativas y rankings.
 */
export interface ItemComparacionConsumoDto {
  device_id: number;
  device_name: string;
  room_id: number;
  room_name: string;
  /** Consumo total del dispositivo en kWh */
  total_kwh: number;
  /** Porcentaje respecto al consumo total */
  percentage: number;
}

/**
 * Consumo agregado por habitación.
 * Incluye el desglose por dispositivo dentro de la habitación.
 */
export interface ConsumoHabitacionDTO {
  room_id: number;
  room_name: string;
  /** Consumo total de la habitación en kWh */
  total_kwh: number;
  /** Duración total de uso en minutos */
  total_duration_minutes: number;
  /** Desglose de consumo por dispositivo */
  devices: ItemComparacionConsumoDto[];
}

/**
 * Respuesta completa de comparación de consumo.
 * Agrupa todos los dispositivos con sus porcentajes relativos.
 */
export interface ComparacionConsumoRespuestaDto {
  /** Consumo total combinado en kWh */
  total_kwh: number;
  devices: ItemComparacionConsumoDto[];
}

/**
 * Resumen de consumo de un dispositivo en múltiples períodos.
 */
export interface ConsumoDispositivoDTO {
  device_id: number;
  device_name: string;
  /** Consumo del día actual en kWh */
  daily_kwh: number;
  /** Consumo de la semana actual en kWh */
  weekly_kwh: number;
  /** Consumo del mes actual en kWh */
  monthly_kwh: number;
}

/**
 * Respuesta completa de un reporte de consumo.
 * Incluye totales, conteos y los mayores consumidores.
 */
export interface ReporteRespuestaDto {
  /** Consumo total en kWh del período */
  total_kwh: number;
  /** Duración total de uso en minutos */
  total_duration_minutes: number;
  /** Cantidad de dispositivos incluidos */
  device_count: number;
  /** Cantidad de alertas generadas en el período */
  alert_count: number;
  /** Ranking de dispositivos con mayor consumo */
  top_consumers: ItemComparacionConsumoDto[];
}
