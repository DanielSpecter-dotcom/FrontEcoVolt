# Plan: límites de acceso por rol (PERSONAL vs EMPRESARIAL)

## Contexto

Hoy existen dos roles (`PERSONAL` y `EMPRESARIAL`, guardados en `StateService.userRole`), pero ningún componente los usa: ambos roles ven exactamente los mismos datos y pueden hacer lo mismo. El objetivo es que el rol empiece a tener consecuencias reales, **enfocadas en límites concretos de datos/cantidad** (no en ocultar pantallas enteras), siguiendo el patrón acordado: en el reporte de Consumo, PERSONAL ve solo su casa (diario/semanal/mensual) y EMPRESARIAL ve una comparativa de esos mismos intervalos entre todas sus casas. Ese mismo patrón se extiende a Alertas y Rutinas. El límite de casas para PERSONAL queda fijado en **1 sola casa** (EMPRESARIAL sin límite).

Hallazgo clave: en `consumo.html:235` ya existe un botón de tab **"Comparativa"** (`activeTab === 'comparativa'`) sin ningún contenido implementado detrás — es el lugar natural para construir la vista multi-casa de EMPRESARIAL.

## Cambios en `StateService` (src/app/servicios/state.service.ts)

Agregar junto a los getters de selección existentes (cerca de `selectedCasa`, línea ~385):

- `get esEmpresarial(): boolean` → `this.userRole === 'EMPRESARIAL'`
- `get puedeCrearCasa(): boolean` → `this.esEmpresarial || this.casas.length < 1` (límite de 1 casa para PERSONAL)
- `consumoKwhDeCasa(casaId: number): number` — generaliza la lógica que ya usa `casa.ts` en `consumoHoyCasaSeleccionada` (líneas 109-115): filtra `devices` por habitaciones de esa casa y suma `consumoHoy`.
- `casaDeDispositivo(deviceId: number): CasaDTO | null` — resuelve `device.habitacionId` → `habitacion.casa_id` → casa. Reutilizable por Alertas.

`casa.ts:consumoHoyCasaSeleccionada` puede simplificarse para llamar a `this.stateService.consumoKwhDeCasa(this.selectedCasaId)` (evita duplicar la reducción).

## 1. Límite de casas (Casa + Dispositivos)

**Archivos:** `src/app/componentes/casa/casa.ts` (líneas 133-171) y `src/app/componentes/dispositivos/dispositivos.ts` (líneas 165-203) — lógica `createHome()` duplicada en ambos.

- Al inicio de `createHome()` en los dos archivos, antes de leer `newCasaNombre`:
  ```ts
  if (!this.stateService.puedeCrearCasa) {
    alert('Tu plan Personal permite gestionar 1 sola casa. Actualiza a EcoVolt Empresarial para administrar más propiedades.');
    return;
  }
  ```
- En `casa.html` y `dispositivos.html`: envolver el input + botón "Agregar casa" en `*ngIf="stateService.puedeCrearCasa"`, y mostrar un mensaje/upsell corto cuando sea `false` (mismo texto que el alert, en línea en vez de modal).

## 2. Consumo — comparativa entre casas (`src/app/componentes/consumo/`)

**consumo.ts:**
- Reemplazar `this.devices` (getter línea 116, que apunta a `stateService.devices` global) por `this.stateService.dispositivosDeCasaSeleccionada` en los puntos donde alimenta `roomStats` (fallback local, línea ~178) y `historialSemanal` (`hasDevices`, línea 221). Esto deja "Por Ambiente"/"Reportes" explícitamente acotados a la casa activa (sin cambio visible para PERSONAL, que solo tiene una).
- En `ngOnInit`, si `activeTab === 'comparativa'` y `!stateService.esEmpresarial`, forzar `activeTab = 'ambiente'` (por si quedó guardado en localStorage).
- Nuevo getter `comparativaCasas`:
  ```ts
  get comparativaCasas(): { casa: CasaDTO; kwh: number; costo: number; pct: number }[] {
    const tfMultiplier = this.activeTimeframe === 'dia' ? 0.2 : this.activeTimeframe === 'mes' ? 4.3 : 1;
    const rate = 0.52;
    const filas = this.stateService.casas.map(casa => {
      const kwh = this.stateService.consumoKwhDeCasa(casa.id) * tfMultiplier;
      return { casa, kwh: parseFloat(kwh.toFixed(1)), costo: parseFloat((kwh * rate).toFixed(2)), pct: 0 };
    });
    const max = Math.max(1, ...filas.map(f => f.kwh));
    filas.forEach(f => f.pct = Math.round((f.kwh / max) * 100));
    return filas.sort((a, b) => b.kwh - a.kwh);
  }
  ```
  (reutiliza los mismos multiplicadores de timeframe y tarifa que ya existen en `historialSemanal`/`ambientes`).

**consumo.html:**
- Línea 235: envolver el botón del tab en `*ngIf="stateService.esEmpresarial"`.
- Agregar bloque `*ngIf="activeTab === 'comparativa'"` (junto a las secciones de los otros tabs) que recorra `comparativaCasas` y pinte, por casa: nombre, kWh del timeframe activo (ya seleccionable con los botones día/semana/mes existentes), costo estimado, y una barra horizontal simple (`[style.width.%]="fila.pct"`) — mismo estilo "sin librería de gráficos" que el resto del componente.

## 3. Alertas — vista consolidada (`src/app/componentes/alertas/`)

**alertas.ts:**
- Nuevo campo `filtroCasaId: number | null = null`.
- `alertasFiltradas` (línea 146): agregar condición `matchCasa = !this.filtroCasaId || this.stateService.casaDeDispositivo(a.deviceId)?.id === this.filtroCasaId`.
- Nuevo getter `casaDeAlerta(alerta: Alerta)` que delega en `stateService.casaDeDispositivo(alerta.deviceId)` para mostrar el nombre de la casa en cada fila.

**alertas.html:**
- Envolver un selector/dropdown de casa (similar a los botones de `filtroActivo`) en `*ngIf="stateService.esEmpresarial && stateService.casas.length > 1"`, con opción "Todas las casas".
- Mostrar un badge con el nombre de la casa junto a cada alerta solo cuando `stateService.esEmpresarial` (PERSONAL no lo necesita, solo tiene una).

## 4. Rutinas — resumen por casa (`src/app/componentes/rutinas/`)

La edición sigue acotada a `rutinasDeCasaSeleccionada` (ya correcto, sin cambios). Se agrega solo un resumen cuando hay más de una casa:

**rutinas.ts:**
- Nuevo getter `resumenPorCasa(): { casa: CasaDTO; activas: number }[]` que recorre `stateService.casas` y cuenta `stateService.routines.filter(r => r.homeId === casa.id && r.activa).length`.

**rutinas.html:**
- Franja superior (sobre la lista de rutinas) con `*ngIf="stateService.esEmpresarial && stateService.casas.length > 1"`, mostrando `resumenPorCasa` como chips: "Casa Principal: 3 activas".

## Verificación

1. `npm run build` (o `ng build`) para confirmar que compila sin errores de tipos en los 4 componentes tocados.
2. `ng serve` y probar manualmente en navegador:
   - Usuario PERSONAL con 1 casa: botón "Agregar casa" deshabilitado/oculto con mensaje de upsell; tab "Comparativa" no aparece en Consumo; Alertas y Rutinas sin selector/resumen de casa (comportamiento idéntico al actual).
   - Usuario EMPRESARIAL con 2+ casas: puede seguir creando casas; tab "Comparativa" muestra kWh/costo por casa y cambia correctamente con día/semana/mes; Alertas muestra filtro + badge de casa; Rutinas muestra la franja de resumen por casa.
