/**
 * Objeto de transferencia del perfil de usuario.
 * Incluye datos personales, preferencias de notificación y roles.
 */
export interface UsuarioDTO {
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  tipo_usuario: string;
  activo: boolean;
  /** Preferencia: notificar consumo excesivo */
  consumo_excesivo: boolean;
  /** Preferencia: notificar uso prolongado */
  uso_prolongado: boolean;
  /** Preferencia: recibir reporte semanal */
  reporte_semanal: boolean;
  roles: string[];
}
