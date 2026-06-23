/**
 * Envoltorio genérico para todas las respuestas del backend.
 * Cada endpoint retorna esta estructura con los datos tipados en `data`.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
