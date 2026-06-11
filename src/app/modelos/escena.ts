/**
 * Dispositivo dentro de una escena con su estado deseado.
 */
export interface EscenaDispositivoDTO {
  device_id: number;
  /** true = encender, false = apagar al activar la escena */
  desired_on: boolean;
}

/**
 * Escena de automatización que agrupa múltiples dispositivos
 * con estados deseados para activarlos simultáneamente.
 */
export interface EscenaDTO {
  id: number;
  name: string;
  /** Lista de dispositivos y su estado deseado en la escena */
  devices: EscenaDispositivoDTO[];
}

/**
 * Respuesta al activar una escena.
 * Confirma qué dispositivos fueron afectados y cuándo.
 */
export interface ActivacionEscenaDTO {
  scene_id: number;
  /** Fecha y hora de activación (ISO 8601) */
  activated_at: string;
  /** Dispositivos a los que se aplicó la escena */
  applied_devices: EscenaDispositivoDTO[];
}
