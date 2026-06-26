import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

// ==================== DTOs ====================

export interface UsuarioDTO {
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  tipo_usuario: string;
  activo: boolean;
  consumo_excesivo: boolean;
  uso_prolongado: boolean;
  reporte_semanal: boolean;
  roles: string[];
  telefono?: string;
  ciudad?: string;
}

export interface CasaDTO {
  id: number;
  nombre: string;
  usuario_id: number;
}

export interface HabitacionDTO {
  id: number;
  name: string;
  casa_id: number;
}

export interface DispositivoDTO {
  id: number;
  nombre: string;
  tipo: string;
  potencia_watts: number;
  limite_kwh: number;
  status: string;
  mode: string;
  habitacion_id: number;
  habitacion_nombre: string;
}

export interface HistoricoDTO {
  id: number;
  fecha_registro: string;
  kwh_consumidos: number;
  duracion_minutos: number;
  dispositivo_id: number;
  dispositivo_nombre: string;
}

export interface ConsumoHabitacionDTO {
  room_id: number;
  room_name: string;
  total_kwh: number;
  total_duration_minutes: number;
  devices: ItemComparacionConsumoDto[];
}

export interface ItemComparacionConsumoDto {
  device_id: number;
  device_name: string;
  room_id: number;
  room_name: string;
  total_kwh: number;
  percentage: number;
}

export interface ComparacionConsumoRespuestaDto {
  total_kwh: number;
  devices: ItemComparacionConsumoDto[];
}

export interface ConsumoDispositivoDTO {
  device_id: number;
  device_name: string;
  daily_kwh: number;
  weekly_kwh: number;
  monthly_kwh: number;
}

export interface AlertaDTO {
  id: number;
  tipo: string;
  mensaje: string;
  leido: boolean;
  fecha_creacion: string;
  device_id: number;
  device_name: string;
}

export interface LimiteRespuestaDto {
  device_id: number;
  device_name: string;
  limit_kwh: number;
}

export interface EscenaDTO {
  id: number;
  name: string;
  devices: { device_id: number; desired_on: boolean }[];
}

export interface ActivacionEscenaDTO {
  scene_id: number;
  activated_at: string;
  applied_devices: { device_id: number; desired_on: boolean }[];
}

export interface RutinaDTO {
  id: number;
  home_id: number;
  name: string;
  execution_time: string;
  days_of_week: string[];
  actions: { device_id: number; turn_on: boolean }[];
  enabled: boolean;
  paused_by_away_mode: boolean;
}

export interface ResumenPanelDto {
  consumoDiarioKwh: number;
  consumoMensualKwh: number;
  costoEstimadoSoles: number;
  variacionPorcentaje: number;
}

export interface DispositivoPanelDto {
  id: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  estado: string;
  activo: boolean;
}

export interface EscenasRutinasPanelDto {
  escenas: { id: number; nombre: string; tipo: string; estado: string }[];
  rutinas: { id: number; nombre: string; tipo: string; estado: string }[];
}

export interface ActividadPanelDto {
  hora: string;
  descripcion: string;
  tipo: string;
}

export interface ReporteRespuestaDto {
  total_kwh: number;
  total_duration_minutes: number;
  device_count: number;
  alert_count: number;
  top_consumers: ItemComparacionConsumoDto[];
}

export interface AwayModeResponse {
  home_id: number;
  away_mode_enabled: boolean;
  paused_routines: number;
}

// ==================== Service ====================

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = '/api/v1';

  constructor(private http: HttpClient) {}

  // ─── Usuarios ───────────────────────────────────

  getMe(): Observable<ApiResponse<UsuarioDTO>> {
    return this.http.get<ApiResponse<UsuarioDTO>>(`${this.base}/usuarios/me`);
  }

  getUserById(id: number): Observable<ApiResponse<UsuarioDTO>> {
    return this.http.get<ApiResponse<UsuarioDTO>>(`${this.base}/usuarios/encontrarusuario/${id}`);
  }

  updateUser(id: number, data: { nombre: string; apellido?: string; correo?: string; telefono?: string; ciudad?: string }): Observable<ApiResponse<UsuarioDTO>> {
    return this.http.put<ApiResponse<UsuarioDTO>>(`${this.base}/usuarios/actualizarusuario/${id}`, data);
  }

  changePassword(id: number, data: { contrasena_actual: string; nueva_contrasena: string }): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.base}/usuarios/${id}/password`, data);
  }

  updateNotificationSettings(id: number, data: { consumo_excesivo: boolean; uso_prolongado: boolean; reporte_semanal: boolean }): Observable<ApiResponse<UsuarioDTO>> {
    return this.http.patch<ApiResponse<UsuarioDTO>>(`${this.base}/usuarios/${id}/notification-settings`, data);
  }

  // ─── Casas ──────────────────────────────────────

  getHomes(): Observable<ApiResponse<CasaDTO[]>> {
    return this.http.get<ApiResponse<CasaDTO[]>>(`${this.base}/homes/listarcasas`);
  }

  createHome(data: { nombre: string; usuario_id: number }): Observable<ApiResponse<CasaDTO>> {
    return this.http.post<ApiResponse<CasaDTO>>(`${this.base}/homes/insertarcasa`, data);
  }

  updateHome(id: number, data: { nombre: string; usuario_id: number }): Observable<ApiResponse<CasaDTO>> {
    return this.http.put<ApiResponse<CasaDTO>>(`${this.base}/homes/actualizarcasa/${id}`, data);
  }

  deleteHome(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/homes/eliminarcasa/${id}`);
  }

  toggleAwayMode(homeId: number, enabled: boolean): Observable<ApiResponse<AwayModeResponse>> {
    return this.http.patch<ApiResponse<AwayModeResponse>>(`${this.base}/homes/${homeId}/away-mode`, {
      away_mode_enabled: enabled
    });
  }

  // ─── Habitaciones ───────────────────────────────

  getRooms(): Observable<ApiResponse<HabitacionDTO[]>> {
    return this.http.get<ApiResponse<HabitacionDTO[]>>(`${this.base}/rooms/listarhabitaciones`);
  }

  createRoom(data: { casa_id: number; nombre: string }): Observable<ApiResponse<HabitacionDTO>> {
    return this.http.post<ApiResponse<HabitacionDTO>>(`${this.base}/rooms/insertarhabitacion`, data);
  }

  updateRoom(id: number, data: { casa_id: number; nombre: string }): Observable<ApiResponse<HabitacionDTO>> {
    return this.http.put<ApiResponse<HabitacionDTO>>(`${this.base}/rooms/actualizarhabitacion/${id}`, data);
  }

  deleteRoom(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/rooms/eliminarhabitacion/${id}`);
  }

  // ─── Dispositivos ──────────────────────────────

  getDevices(): Observable<ApiResponse<DispositivoDTO[]>> {
    return this.http.get<ApiResponse<DispositivoDTO[]>>(`${this.base}/devices`);
  }

  getDevice(id: number): Observable<ApiResponse<DispositivoDTO>> {
    return this.http.get<ApiResponse<DispositivoDTO>>(`${this.base}/devices/${id}`);
  }

  createDevice(data: {
    habitacion_id: number;
    nombre: string;
    tipo: string;
    activo: boolean;
    automatico: boolean;
    limite_kwh?: number;
  }): Observable<ApiResponse<DispositivoDTO>> {
    return this.http.post<ApiResponse<DispositivoDTO>>(`${this.base}/devices`, data);
  }

  updateDevice(id: number, data: {
    nombre: string;
    tipo: string;
    activo?: boolean;
    automatico?: boolean;
    limite_kwh?: number;
    room_id?: number;
  }): Observable<ApiResponse<DispositivoDTO>> {
    return this.http.put<ApiResponse<DispositivoDTO>>(`${this.base}/devices/${id}`, data);
  }

  deleteDevice(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/devices/${id}`);
  }

  toggleDeviceStatus(id: number, status: 'ON' | 'OFF'): Observable<ApiResponse<DispositivoDTO>> {
    return this.http.patch<ApiResponse<DispositivoDTO>>(`${this.base}/devices/${id}/status`, { status });
  }

  toggleDeviceMode(id: number, mode: 'AUTOMATIC' | 'MANUAL'): Observable<ApiResponse<DispositivoDTO>> {
    return this.http.patch<ApiResponse<DispositivoDTO>>(`${this.base}/devices/${id}/mode`, { mode });
  }

  moveDeviceRoom(id: number, roomId: number): Observable<ApiResponse<DispositivoDTO>> {
    return this.http.patch<ApiResponse<DispositivoDTO>>(`${this.base}/devices/${id}/room`, { room_id: roomId });
  }

  // ─── Consumo ────────────────────────────────────

  getConsumptionHistory(): Observable<ApiResponse<HistoricoDTO[]>> {
    return this.http.get<ApiResponse<HistoricoDTO[]>>(`${this.base}/consumption/history`);
  }

  getConsumptionByRoom(roomId: number): Observable<ApiResponse<ConsumoHabitacionDTO>> {
    return this.http.get<ApiResponse<ConsumoHabitacionDTO>>(`${this.base}/consumption/rooms/${roomId}`);
  }

  getConsumptionCompare(): Observable<ApiResponse<ComparacionConsumoRespuestaDto>> {
    return this.http.get<ApiResponse<ComparacionConsumoRespuestaDto>>(`${this.base}/consumption/compare`);
  }

  getConsumptionByDevice(deviceId: number): Observable<ApiResponse<ConsumoDispositivoDTO>> {
    return this.http.get<ApiResponse<ConsumoDispositivoDTO>>(`${this.base}/consumption/devices/${deviceId}`);
  }

  // ─── Alertas ────────────────────────────────────

  getAlerts(): Observable<ApiResponse<AlertaDTO[]>> {
    return this.http.get<ApiResponse<AlertaDTO[]>>(`${this.base}/alerts`);
  }

  getAlertHistory(): Observable<ApiResponse<AlertaDTO[]>> {
    return this.http.get<ApiResponse<AlertaDTO[]>>(`${this.base}/alerts/history`);
  }

  filterAlerts(params: { device?: number; from?: string; to?: string }): Observable<ApiResponse<AlertaDTO[]>> {
    let httpParams = new HttpParams();
    if (params.device) httpParams = httpParams.set('device', params.device.toString());
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    return this.http.get<ApiResponse<AlertaDTO[]>>(`${this.base}/alerts/filter`, { params: httpParams });
  }

  markAlertRead(alertId: number): Observable<ApiResponse<AlertaDTO>> {
    return this.http.patch<ApiResponse<AlertaDTO>>(`${this.base}/alerts/${alertId}/read`, {});
  }

  deleteAlert(alertId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/alerts/${alertId}`);
  }

  setAlertLimit(deviceId: number, limitKwh: number): Observable<ApiResponse<LimiteRespuestaDto>> {
    return this.http.post<ApiResponse<LimiteRespuestaDto>>(`${this.base}/alerts/limits`, {
      device_id: deviceId,
      limit_kwh: limitKwh
    });
  }

  updateAlertLimit(deviceId: number, limitKwh: number): Observable<ApiResponse<LimiteRespuestaDto>> {
    return this.http.put<ApiResponse<LimiteRespuestaDto>>(`${this.base}/alerts/limits/${deviceId}`, {
      device_id: deviceId,
      limit_kwh: limitKwh
    });
  }

  // ─── Escenas ────────────────────────────────────

  getScenes(): Observable<ApiResponse<EscenaDTO[]>> {
    return this.http.get<ApiResponse<EscenaDTO[]>>(`${this.base}/scenes`);
  }

  createScene(data: { nombre: string; devices: { device_id: number; desired_on: boolean }[] }): Observable<ApiResponse<EscenaDTO>> {
    return this.http.post<ApiResponse<EscenaDTO>>(`${this.base}/scenes`, data);
  }

  getScene(id: number): Observable<ApiResponse<EscenaDTO>> {
    return this.http.get<ApiResponse<EscenaDTO>>(`${this.base}/scenes/${id}`);
  }

  updateScene(id: number, data: { nombre: string; devices: { device_id: number; desired_on: boolean }[] }): Observable<ApiResponse<EscenaDTO>> {
    return this.http.put<ApiResponse<EscenaDTO>>(`${this.base}/scenes/${id}`, data);
  }

  deleteScene(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/scenes/${id}`);
  }

  activateScene(id: number): Observable<ApiResponse<ActivacionEscenaDTO>> {
    return this.http.post<ApiResponse<ActivacionEscenaDTO>>(`${this.base}/scenes/${id}/activate`, {});
  }

  // ─── Rutinas ────────────────────────────────────

  getRoutines(): Observable<ApiResponse<RutinaDTO[]>> {
    return this.http.get<ApiResponse<RutinaDTO[]>>(`${this.base}/routines`);
  }

  getRoutine(id: number): Observable<ApiResponse<RutinaDTO>> {
    return this.http.get<ApiResponse<RutinaDTO>>(`${this.base}/routines/${id}`);
  }

  createRoutine(data: {
    home_id: number;
    nombre: string;
    execution_time: string;
    days_of_week: string[];
    acciones: { device_id: number; encendido: boolean }[];
  }): Observable<ApiResponse<RutinaDTO>> {
    return this.http.post<ApiResponse<RutinaDTO>>(`${this.base}/routines`, data);
  }

  updateRoutine(id: number, data: {
    name?: string;
    execution_time?: string;
    days_of_week?: string[];
    acciones?: { device_id: number; encendido: boolean }[];
    enabled?: boolean;
    home_id?: number;
  }): Observable<ApiResponse<RutinaDTO>> {
    return this.http.patch<ApiResponse<RutinaDTO>>(`${this.base}/routines/${id}`, data);
  }

  deleteRoutine(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/routines/${id}`);
  }

  // ─── Dashboard ──────────────────────────────────

  getDashboardSummary(): Observable<ApiResponse<ResumenPanelDto>> {
    return this.http.get<ApiResponse<ResumenPanelDto>>(`${this.base}/dashboard/summary`);
  }

  getDashboardDevices(): Observable<ApiResponse<DispositivoPanelDto[]>> {
    return this.http.get<ApiResponse<DispositivoPanelDto[]>>(`${this.base}/dashboard/devices`);
  }

  getDashboardScenesRoutines(): Observable<ApiResponse<EscenasRutinasPanelDto>> {
    return this.http.get<ApiResponse<EscenasRutinasPanelDto>>(`${this.base}/dashboard/scenes-routines`);
  }

  getDashboardActivity(): Observable<ApiResponse<ActividadPanelDto[]>> {
    return this.http.get<ApiResponse<ActividadPanelDto[]>>(`${this.base}/dashboard/activity`);
  }

  activateDashboardScene(id: number): Observable<ApiResponse<ActivacionEscenaDTO>> {
    return this.http.post<ApiResponse<ActivacionEscenaDTO>>(`${this.base}/dashboard/scenes/${id}/activate`, {});
  }

  pauseDashboardRoutine(id: number): Observable<ApiResponse<RutinaDTO>> {
    return this.http.patch<ApiResponse<RutinaDTO>>(`${this.base}/dashboard/routines/${id}/pause`, {});
  }

  // ─── Reportes ───────────────────────────────────

  getReport(): Observable<ApiResponse<ReporteRespuestaDto>> {
    return this.http.get<ApiResponse<ReporteRespuestaDto>>(`${this.base}/reports`);
  }

  downloadReportPdf(): Observable<Blob> {
    return this.http.get(`${this.base}/reports/export/pdf`, {
      responseType: 'blob'
    });
  }
}
