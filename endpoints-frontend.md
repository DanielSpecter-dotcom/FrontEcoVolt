# EcoVolt - mapa de endpoints para frontend

Base URL local sugerida: `http://localhost:8080`

Headers:
- Publicos: `Content-Type: application/json`
- Protegidos: `Content-Type: application/json`, `Authorization: Bearer {{token}}`

Respuesta JSON estandar, excepto descarga PDF:

```json
{
  "success": true,
  "message": "Mensaje de la operacion",
  "data": {}
}
```

Errores comunes:

```json
{
  "success": false,
  "message": "Detalle del error",
  "data": null
}
```

Notas:
- `/api/v1/auth/**` es publico.
- Los demas endpoints requieren JWT.
- `consumption`, `reports`, `alerts`, `dashboard` y `devices` requieren rol `PERSONAL` o `EMPRESARIAL`.
- Fechas `LocalDateTime`: formato tipo `2026-05-09T10:30:00`.
- Horas `LocalTime`: formato `HH:mm`.
- Dias validos: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`.

## Auth

- `POST http://localhost:8080/api/v1/auth/login`
  - Request body: `correo` string email requerido, `contrasena` string requerido.
  - Response `data`: `token` string, `token_type` string, `expires_in` number.

- `POST http://localhost:8080/api/v1/auth/register`
  - Request body PERSONAL: `dni` string 8 digitos requerido, `correo` string email requerido, `contrasena` string 8-100 requerido, `tipo_uso` enum requerido (`PERSONAL`).
  - Request body EMPRESARIAL: `dni` string 8 digitos requerido, `correo` string email requerido, `contrasena` string 8-100 requerido, `tipo_uso` enum requerido (`EMPRESARIAL`), `nombre_empresa` string requerido max 150, `ruc` string 11 digitos requerido.
  - Response `data`: `correo` string, `verification_token` string, `expires_at` datetime, `verification_link` string.

- `POST http://localhost:8080/api/v1/auth/verify-email`
  - Request body: `token` string requerido.
  - Response `data`: `null`.

- `POST http://localhost:8080/api/v1/auth/resend-verification`
  - Request body: `correo` string email requerido.
  - Response `data`: `correo` string, `verification_token` string, `expires_at` datetime, `verification_link` string.

## Usuarios

- `POST http://localhost:8080/api/v1/usuarios/insertarusuario`
  - Request body: `id` number opcional, `dni` string, `nombre` string, `apellido` string, `correo` string, `username` string, `contrasena` string, `tipoUsuario` enum (`PERSONAL`/`EMPRESARIAL`), `nombreEmpresa` string opcional, `ruc` string opcional, `activo` boolean, `roles` array opcional.
  - Response `data`: `id` number, `nombre` string, `apellido` string, `username` string, `correo` string, `tipo_usuario` enum, `activo` boolean, `consumo_excesivo` boolean, `uso_prolongado` boolean, `reporte_semanal` boolean, `roles` array string.

- `GET http://localhost:8080/api/v1/usuarios/listarusuarios`
  - Request: sin body.
  - Response `data`: array de UsuarioDTO (`id`, `nombre`, `apellido`, `username`, `correo`, `tipo_usuario`, `activo`, `consumo_excesivo`, `uso_prolongado`, `reporte_semanal`, `roles`).

- `GET http://localhost:8080/api/v1/usuarios/encontrarusuario/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: UsuarioDTO (`id`, `nombre`, `apellido`, `username`, `correo`, `tipo_usuario`, `activo`, `consumo_excesivo`, `uso_prolongado`, `reporte_semanal`, `roles`).

- `PUT http://localhost:8080/api/v1/usuarios/actualizarusuario/{id}`
  - Path params: `id` number.
  - Request body: `nombre` string requerido max 120.
  - Response `data`: UsuarioDTO (`id`, `nombre`, `apellido`, `username`, `correo`, `tipo_usuario`, `activo`, `consumo_excesivo`, `uso_prolongado`, `reporte_semanal`, `roles`).

- `PATCH http://localhost:8080/api/v1/usuarios/{id}/password`
  - Path params: `id` number.
  - Request body: `contrasena_actual` string requerido, `nueva_contrasena` string requerido 8-100.
  - Response `data`: `null`.

- `PATCH http://localhost:8080/api/v1/usuarios/{id}/notification-settings`
  - Path params: `id` number.
  - Request body: `consumo_excesivo` boolean requerido, `uso_prolongado` boolean requerido, `reporte_semanal` boolean requerido.
  - Response `data`: UsuarioDTO (`id`, `nombre`, `apellido`, `username`, `correo`, `tipo_usuario`, `activo`, `consumo_excesivo`, `uso_prolongado`, `reporte_semanal`, `roles`).

- `DELETE http://localhost:8080/api/v1/usuarios/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

- `POST http://localhost:8080/api/v1/usuarios/roles`
  - Request body: `id` number opcional, `nombre` string requerido.
  - Response `data`: `id` number, `nombre` string.

- `GET http://localhost:8080/api/v1/usuarios/roles`
  - Request: sin body.
  - Response `data`: array de Rol (`id`, `nombre`).

- `GET http://localhost:8080/api/v1/usuarios/roles/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: Rol (`id`, `nombre`).

- `PUT http://localhost:8080/api/v1/usuarios/roles/{id}`
  - Path params: `id` number.
  - Request body: `nombre` string.
  - Response `data`: Rol (`id`, `nombre`).

- `DELETE http://localhost:8080/api/v1/usuarios/roles/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

## Casas

- `POST http://localhost:8080/api/v1/homes/insertarcasa`
  - Request body: `id` number opcional, `nombre` string, `usuario_id` number.
  - Response `data`: `id` number, `nombre` string, `usuario_id` number.

- `GET http://localhost:8080/api/v1/homes/listarcasas`
  - Request: sin body.
  - Response `data`: array de CasaDTO (`id`, `nombre`, `usuario_id`).

- `GET http://localhost:8080/api/v1/homes/encontrarcasa/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: CasaDTO (`id`, `nombre`, `usuario_id`).

- `PUT http://localhost:8080/api/v1/homes/actualizarcasa/{id}`
  - Path params: `id` number.
  - Request body: `id` number opcional, `nombre` string, `usuario_id` number.
  - Response `data`: CasaDTO (`id`, `nombre`, `usuario_id`).

- `DELETE http://localhost:8080/api/v1/homes/eliminarcasa/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

- `PATCH http://localhost:8080/api/v1/homes/{id}/away-mode`
  - Path params: `id` number.
  - Request body: `away_mode_enabled` boolean requerido.
  - Response `data`: `home_id` number, `away_mode_enabled` boolean, `paused_routines` number.

## Habitaciones

- `POST http://localhost:8080/api/v1/rooms/insertarhabitacion`
  - Request body: `casa_id` number requerido o alias `home_id`, `nombre` string requerido max 80.
  - Response `data`: `id` number, `name` string, `casa_id` number.

- `GET http://localhost:8080/api/v1/rooms/listarhabitaciones`
  - Request: sin body.
  - Response `data`: array de HabitacionDTO (`id`, `name`, `casa_id`).

- `GET http://localhost:8080/api/v1/rooms/encontrarhabitacion/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: HabitacionDTO (`id`, `name`, `casa_id`).

- `PUT http://localhost:8080/api/v1/rooms/actualizarhabitacion/{id}`
  - Path params: `id` number.
  - Request body: `casa_id` number requerido o alias `home_id`, `nombre` string requerido max 80.
  - Response `data`: HabitacionDTO (`id`, `name`, `casa_id`).

- `DELETE http://localhost:8080/api/v1/rooms/eliminarhabitacion/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

## Dispositivos

- `POST http://localhost:8080/api/v1/devices`
  - Ruta equivalente: `POST http://localhost:8080/api/v1/devices/insertar`.
  - Request body: `habitacion_id` number requerido o alias `room_id`, `nombre` string requerido max 80, `tipo` string requerido max 80 o alias `tipo_dispositivo`, `activo` boolean requerido, `automatico` boolean requerido, `limite_kwh` number mayor o igual a 0 opcional.
  - Response `data`: `id` number, `nombre` string, `tipo` string, `potencia_watts` number, `limite_kwh` number, `status` string, `mode` string, `habitacion_id` number, `habitacion_nombre` string.

- `GET http://localhost:8080/api/v1/devices`
  - Ruta equivalente: `GET http://localhost:8080/api/v1/devices/listar`.
  - Request: sin body.
  - Response `data`: array de DispositivoDTO (`id`, `nombre`, `tipo`, `potencia_watts`, `limite_kwh`, `status`, `mode`, `habitacion_id`, `habitacion_nombre`).

- `GET http://localhost:8080/api/v1/devices/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: DispositivoDTO (`id`, `nombre`, `tipo`, `potencia_watts`, `limite_kwh`, `status`, `mode`, `habitacion_id`, `habitacion_nombre`).

- `PATCH http://localhost:8080/api/v1/devices/{id}/room`
  - Path params: `id` number.
  - Request body: `room_id` number requerido o alias `habitacion_id`.
  - Response `data`: DispositivoDTO (`id`, `nombre`, `tipo`, `potencia_watts`, `limite_kwh`, `status`, `mode`, `habitacion_id`, `habitacion_nombre`).

- `PUT http://localhost:8080/api/v1/devices/{id}`
  - Path params: `id` number.
  - Request body: `nombre` string requerido max 80, `tipo` string requerido max 80 o alias `tipo_dispositivo`, `activo` boolean opcional, `automatico` boolean opcional, `limite_kwh` number mayor o igual a 0 opcional, `room_id` number opcional o alias `habitacion_id`.
  - Response `data`: DispositivoDTO (`id`, `nombre`, `tipo`, `potencia_watts`, `limite_kwh`, `status`, `mode`, `habitacion_id`, `habitacion_nombre`).

- `DELETE http://localhost:8080/api/v1/devices/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

- `PATCH http://localhost:8080/api/v1/devices/{id}/status`
  - Path params: `id` number.
  - Request body: `status` string requerido (`ON`/`OFF`).
  - Response `data`: DispositivoDTO (`id`, `nombre`, `tipo`, `potencia_watts`, `limite_kwh`, `status`, `mode`, `habitacion_id`, `habitacion_nombre`).

- `PATCH http://localhost:8080/api/v1/devices/{id}/mode`
  - Path params: `id` number.
  - Request body: `mode` string requerido (`AUTOMATIC`/`MANUAL`).
  - Response `data`: DispositivoDTO (`id`, `nombre`, `tipo`, `potencia_watts`, `limite_kwh`, `status`, `mode`, `habitacion_id`, `habitacion_nombre`).

## Consumo

- `POST http://localhost:8080/api/v1/consumption/history`
  - Request body: `id` number opcional, `fecha_registro` datetime, `kwh_consumidos` number, `duracion_minutos` number, `dispositivo_id` number, `dispositivo_nombre` string opcional.
  - Response `data`: `id` number, `fecha_registro` datetime, `kwh_consumidos` number, `duracion_minutos` number, `dispositivo_id` number, `dispositivo_nombre` string.

- `GET http://localhost:8080/api/v1/consumption/history`
  - Request: sin body.
  - Response `data`: array de HistoricoDTO (`id`, `fecha_registro`, `kwh_consumidos`, `duracion_minutos`, `dispositivo_id`, `dispositivo_nombre`).

- `GET http://localhost:8080/api/v1/consumption/history/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: HistoricoDTO (`id`, `fecha_registro`, `kwh_consumidos`, `duracion_minutos`, `dispositivo_id`, `dispositivo_nombre`).

- `PUT http://localhost:8080/api/v1/consumption/history/{id}`
  - Path params: `id` number.
  - Request body: `id` number opcional, `fecha_registro` datetime, `kwh_consumidos` number, `duracion_minutos` number, `dispositivo_id` number, `dispositivo_nombre` string opcional.
  - Response `data`: HistoricoDTO (`id`, `fecha_registro`, `kwh_consumidos`, `duracion_minutos`, `dispositivo_id`, `dispositivo_nombre`).

- `DELETE http://localhost:8080/api/v1/consumption/history/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

- `GET http://localhost:8080/api/v1/consumption/rooms/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `room_id` number, `room_name` string, `total_kwh` number, `total_duration_minutes` number, `devices` array de ItemComparacionConsumoDto (`device_id`, `device_name`, `room_id`, `room_name`, `total_kwh`, `percentage`).

- `GET http://localhost:8080/api/v1/consumption/compare`
  - Request: sin body.
  - Response `data`: `total_kwh` number, `devices` array de ItemComparacionConsumoDto (`device_id`, `device_name`, `room_id`, `room_name`, `total_kwh`, `percentage`).

- `GET http://localhost:8080/api/v1/consumption/devices/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `device_id` number, `device_name` string, `daily_kwh` number, `weekly_kwh` number, `monthly_kwh` number.

## Alertas

- `POST http://localhost:8080/api/v1/alerts`
  - Request body: `id` number opcional, `tipo` string, `mensaje` string, `leido` boolean, `fecha_creacion` datetime, `device_id` number, `device_name` string opcional.
  - Response `data`: `id` number, `tipo` string, `mensaje` string, `leido` boolean, `fecha_creacion` datetime, `device_id` number, `device_name` string.

- `GET http://localhost:8080/api/v1/alerts`
  - Request: sin body.
  - Response `data`: array de AlertaDTO (`id`, `tipo`, `mensaje`, `leido`, `fecha_creacion`, `device_id`, `device_name`).

- `GET http://localhost:8080/api/v1/alerts/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: AlertaDTO (`id`, `tipo`, `mensaje`, `leido`, `fecha_creacion`, `device_id`, `device_name`).

- `PUT http://localhost:8080/api/v1/alerts/{id}`
  - Path params: `id` number.
  - Request body: `id` number opcional, `tipo` string, `mensaje` string, `leido` boolean, `fecha_creacion` datetime, `device_id` number, `device_name` string opcional.
  - Response `data`: AlertaDTO (`id`, `tipo`, `mensaje`, `leido`, `fecha_creacion`, `device_id`, `device_name`).

- `DELETE http://localhost:8080/api/v1/alerts/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

- `POST http://localhost:8080/api/v1/alerts/limits`
  - Request body: `device_id` number requerido, `limit_kwh` number requerido mayor a 0.
  - Response `data`: `device_id` number, `device_name` string, `limit_kwh` number.

- `PUT http://localhost:8080/api/v1/alerts/limits/{dispositivoId}`
  - Path params: `dispositivoId` number.
  - Request body: `device_id` number requerido, `limit_kwh` number requerido mayor a 0.
  - Response `data`: `device_id` number, `device_name` string, `limit_kwh` number.

- `GET http://localhost:8080/api/v1/alerts/history`
  - Request: sin body.
  - Response `data`: array de AlertaDTO (`id`, `tipo`, `mensaje`, `leido`, `fecha_creacion`, `device_id`, `device_name`).

- `GET http://localhost:8080/api/v1/alerts/filter?device={device_id}&from={yyyy-MM-dd}&to={yyyy-MM-dd}`
  - Query params opcionales: `device` number, `from` date, `to` date.
  - Request: sin body.
  - Response `data`: array de AlertaDTO (`id`, `tipo`, `mensaje`, `leido`, `fecha_creacion`, `device_id`, `device_name`).

- `PATCH http://localhost:8080/api/v1/alerts/{alertaId}/read`
  - Path params: `alertaId` number.
  - Request: sin body.
  - Response `data`: AlertaDTO (`id`, `tipo`, `mensaje`, `leido`, `fecha_creacion`, `device_id`, `device_name`).

## Escenas

- `POST http://localhost:8080/api/v1/scenes`
  - Request body: `nombre` string requerido max 100, `devices` array requerido con objetos (`device_id` number requerido, `desired_on` boolean requerido).
  - Response `data`: `id` number, `name` string, `devices` array (`device_id`, `desired_on`).

- `GET http://localhost:8080/api/v1/scenes`
  - Request: sin body.
  - Response `data`: array de EscenaDTO (`id`, `name`, `devices` array con `device_id`, `desired_on`).

- `GET http://localhost:8080/api/v1/scenes/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: EscenaDTO (`id`, `name`, `devices` array con `device_id`, `desired_on`).

- `PUT http://localhost:8080/api/v1/scenes/{id}`
  - Path params: `id` number.
  - Request body: `nombre` string requerido max 100, `devices` array requerido con objetos (`device_id` number requerido, `desired_on` boolean requerido).
  - Response `data`: EscenaDTO (`id`, `name`, `devices` array con `device_id`, `desired_on`).

- `DELETE http://localhost:8080/api/v1/scenes/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

- `POST http://localhost:8080/api/v1/scenes/{id}/activate`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `scene_id` number, `activated_at` datetime, `applied_devices` array (`device_id`, `desired_on`).

## Rutinas

- `POST http://localhost:8080/api/v1/routines`
  - Request body: `home_id` number requerido, `nombre` string requerido max 100, `execution_time` string `HH:mm` requerido, `days_of_week` array enum requerido, `acciones` array requerido con objetos (`device_id` number requerido, `encendido` boolean requerido).
  - Response `data`: `id` number, `home_id` number, `name` string, `execution_time` string `HH:mm`, `days_of_week` array enum, `actions` array (`device_id`, `turn_on`), `enabled` boolean, `paused_by_away_mode` boolean.

- `GET http://localhost:8080/api/v1/routines`
  - Request: sin body.
  - Response `data`: array de RutinaDTO (`id`, `home_id`, `name`, `execution_time`, `days_of_week`, `actions`, `enabled`, `paused_by_away_mode`).

- `GET http://localhost:8080/api/v1/routines/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: RutinaDTO (`id`, `home_id`, `name`, `execution_time`, `days_of_week`, `actions`, `enabled`, `paused_by_away_mode`).

- `PATCH http://localhost:8080/api/v1/routines/{id}`
  - Path params: `id` number.
  - Request body: `name` string opcional max 100, `execution_time` string `HH:mm` opcional, `days_of_week` array enum opcional, `acciones` array opcional con objetos (`device_id`, `encendido`), `enabled` boolean opcional, `home_id` number opcional.
  - Response `data`: RutinaDTO (`id`, `home_id`, `name`, `execution_time`, `days_of_week`, `actions`, `enabled`, `paused_by_away_mode`).

- `DELETE http://localhost:8080/api/v1/routines/{id}`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `null`.

## Dashboard

- `GET http://localhost:8080/api/v1/dashboard/summary`
  - Request: sin body.
  - Response `data`: `consumoDiarioKwh` number, `consumoMensualKwh` number, `costoEstimadoSoles` number, `variacionPorcentaje` number.

- `GET http://localhost:8080/api/v1/dashboard/devices`
  - Request: sin body.
  - Response `data`: array de DispositivoPanelDto (`id`, `nombre`, `tipo`, `ubicacion`, `estado`, `activo`).

- `GET http://localhost:8080/api/v1/dashboard/scenes-routines`
  - Request: sin body.
  - Response `data`: `escenas` array (`id`, `nombre`, `tipo`, `estado`), `rutinas` array (`id`, `nombre`, `tipo`, `estado`).

- `POST http://localhost:8080/api/v1/dashboard/scenes/{id}/activate`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: `scene_id` number, `activated_at` datetime, `applied_devices` array (`device_id`, `desired_on`).

- `PATCH http://localhost:8080/api/v1/dashboard/routines/{id}/pause`
  - Path params: `id` number.
  - Request: sin body.
  - Response `data`: RutinaDTO (`id`, `home_id`, `name`, `execution_time`, `days_of_week`, `actions`, `enabled`, `paused_by_away_mode`).

- `GET http://localhost:8080/api/v1/dashboard/activity`
  - Request: sin body.
  - Response `data`: array de ActividadPanelDto (`hora` datetime, `descripcion` string, `tipo` string).

## Reportes

- `GET http://localhost:8080/api/v1/reports`
  - Request: sin body.
  - Response `data`: `total_kwh` number, `total_duration_minutes` number, `device_count` number, `alert_count` number, `top_consumers` array de ItemComparacionConsumoDto (`device_id`, `device_name`, `room_id`, `room_name`, `total_kwh`, `percentage`).

- `GET http://localhost:8080/api/v1/reports/export/pdf`
  - Request: sin body.
  - Response: archivo binario PDF (`Content-Type: application/pdf`, header `Content-Disposition: attachment; filename=ecovolt-report.pdf`).
