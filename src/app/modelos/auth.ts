/**
 * Respuesta del endpoint de inicio de sesión (`/auth/login`).
 * Contiene el token JWT y su configuración de expiración.
 */
export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Respuesta del endpoint de registro (`/auth/register`).
 * Incluye el enlace de verificación de correo electrónico.
 */
export interface RegisterResponse {
  correo: string;
  verification_token: string;
  expires_at: string;
  verification_link: string;
}

/**
 * Payload decodificado del token JWT.
 * Contiene la identidad del usuario y sus roles asignados.
 */
export interface JwtPayload {
  /** Correo electrónico del usuario (subject) */
  sub: string;
  /** Lista de roles/autoridades asignadas */
  authorities: string[];
  /** Tipo de token (e.g., 'Bearer') */
  token_type: string;
  /** Timestamp de emisión (issued at) */
  iat: number;
  /** Timestamp de expiración */
  exp: number;
}
