/**
 * Objeto de transferencia de una casa/hogar.
 * Representa el nivel superior de la jerarquía: Casa > Habitación > Dispositivo.
 */
export interface CasaDTO {
  id: number;
  nombre: string;
  usuario_id: number;
}
