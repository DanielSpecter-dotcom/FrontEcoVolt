import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { LucideDynamicIcon } from '@lucide/angular';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { StateService, Dispositivo } from '../../servicios/state.service';
import { ApiService, ComparacionConsumoRespuestaDto } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';
import { CasaDTO, HistoricoDTO } from '../../modelos';

interface DetalleAmbiente {
  habitacionId: number;
  nombre: string;
  dispositivos: number;
  costoMes: number;
  porcentaje: number;
  promedioKwh: number;
  color: string;
  icon: string;
}

interface DiaConsumo {
  dia: string;
  total: number;
  alturaPct: number;
  isHoy: boolean;
}

/** Paleta cíclica para asignar un color distinto a cada habitación real del usuario. */
const PALETA_AMBIENTES = ['#0d9488', '#16a34a', '#4ade80', '#2dd4bf', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444'];

@Component({
  selector: 'app-consumo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatProgressBarModule,
    MatButtonModule,
    MatCardModule,
    BaseChartDirective,
    LucideDynamicIcon,
  ],
  templateUrl: './consumo.html',
  styleUrl: './consumo.css',
})
export class Consumo implements OnInit {
  // Dropdown states
  showProfileMenu = false;
  showNotifications = false;

  activeTab: 'dispositivo' | 'ambiente' | 'reporte' | 'comparativa' = 'ambiente';
  activeTimeframe: 'dia' | 'semana' | 'mes' = 'dia';
  searchTerm = '';

  // Backend data
  backendCompare: ComparacionConsumoRespuestaDto | null = null;
  historico: HistoricoDTO[] = [];

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (!this.stateService.esEmpresarial && this.activeTab === 'comparativa') {
      this.activeTab = 'ambiente';
    }
    if (this.stateService.isBackendConnected) {
      this.loadConsumptionData();
    } else {
      this.stateService.loadFromBackend().then((success) => {
        if (success) this.loadConsumptionData();
      });
    }
  }

  private loadConsumptionData() {
    // Load consumption comparison (kwh real por dispositivo/habitación)
    this.apiService.getConsumptionCompare().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.backendCompare = res.data;
        }
      },
      error: () => {} // Use local calculations
    });

    // Load raw historic records (para construir el gráfico semanal con datos reales)
    this.apiService.getConsumptionHistory().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.historico = res.data;
        }
      },
      error: () => {}
    });
  }

  @HostListener('document:click')
  closeMenus() {
    this.showProfileMenu = false;
    this.showNotifications = false;
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  get userEmail(): string {
    return this.stateService.usuario.email;
  }

  get userName(): string {
    return this.stateService.usuario.nombre;
  }

  get notificationsList() {
    return this.stateService.notificationsList;
  }

  get unreadNotificationsCount(): number {
    return this.stateService.notificationsList.filter(n => !n.leido).length;
  }

  markAllNotificationsAsRead() {
    this.stateService.notificationsList.forEach(n => n.leido = true);
    this.stateService.saveStateToStorage();
  }

  get devices(): Dispositivo[] {
    return this.stateService.dispositivosDeCasaSeleccionada;
  }

  /**
   * Compara el consumo real entre todas las casas del usuario, usando /consumption/compare
   * (no el campo local consumoHoy, que nunca llega a llenarse con datos reales del backend).
   * Cada dispositivo trae su room_id; mapeamos room_id -> casa_id con la lista completa de
   * habitaciones del usuario (no solo las de la casa seleccionada).
   */
  get comparativaCasas(): { casa: CasaDTO; kwh: number; costo: number; pct: number }[] {
    const rate = 0.52;
    const roomToCasa = new Map<number, number>();
    this.stateService.habitaciones.forEach(h => roomToCasa.set(h.id, h.casa_id));

    const kwhPorCasa = new Map<number, number>();

    if (this.backendCompare && this.backendCompare.devices.length > 0) {
      this.backendCompare.devices.forEach(d => {
        if (!d.room_id) return;
        const casaId = roomToCasa.get(d.room_id);
        if (casaId === undefined) return;
        kwhPorCasa.set(casaId, (kwhPorCasa.get(casaId) || 0) + (d.total_kwh || 0));
      });
    } else {
      this.stateService.devices.forEach(d => {
        if (!d.habitacionId) return;
        const casaId = roomToCasa.get(d.habitacionId);
        if (casaId === undefined) return;
        kwhPorCasa.set(casaId, (kwhPorCasa.get(casaId) || 0) + (d.consumoHoy || 0));
      });
    }

    const filas = this.stateService.casas.map(casa => {
      const kwh = kwhPorCasa.get(casa.id) || 0;
      return { casa, kwh: parseFloat(kwh.toFixed(1)), costo: parseFloat((kwh * rate).toFixed(2)), pct: 0 };
    });
    const max = Math.max(1, ...filas.map(f => f.kwh));
    filas.forEach(f => f.pct = Math.round((f.kwh / max) * 100));
    return filas.sort((a, b) => b.kwh - a.kwh);
  }

  get userAvatar(): string | null {
    return this.stateService.usuario.avatar;
  }

  selectTab(tab: 'dispositivo' | 'ambiente' | 'reporte' | 'comparativa') {
    this.activeTab = tab;
  }

  selectTimeframe(tf: 'dia' | 'semana' | 'mes') {
    this.activeTimeframe = tf;
  }

  /**
   * Dispositivos de /consumption/compare que pertenecen a la CASA SELECCIONADA únicamente.
   * El backend devuelve los dispositivos de todas las casas del usuario en una sola lista,
   * así que filtramos por room_id usando las habitaciones de la casa activa.
   */
  private get backendDevicesCasaSeleccionada() {
    if (!this.backendCompare) return [];
    const roomIds = new Set(this.stateService.habitacionesDeCasaSeleccionada.map(h => h.id));
    return this.backendCompare.devices.filter(d => !!d.room_id && roomIds.has(d.room_id));
  }

  get totalMes(): number {
    if (this.backendCompare) {
      const totalCasa = this.backendDevicesCasaSeleccionada.reduce((acc, d) => acc + (d.total_kwh || 0), 0);
      return parseFloat((totalCasa * 0.52).toFixed(2));
    }
    const total = this.devices.reduce((acc, curr) => acc + curr.consumoHoy, 0);
    return parseFloat((total * 30 * 0.52).toFixed(2));
  }

  /** Asigna un icono según el nombre real de la habitación, con un icono genérico por defecto. */
  private iconForRoom(nombre: string): string {
    const n = (nombre || '').toLowerCase();
    if (n.includes('cocina')) return 'utensils';
    if (n.includes('dormitorio') || n.includes('habit') || n.includes('cuarto')) return 'bed';
    if (n.includes('lavand')) return 'washer';
    if (n.includes('sala') || n.includes('living') || n.includes('estar')) return 'sofa';
    return 'door';
  }

  /**
   * Consumo real por habitación, usando las habitaciones que el usuario realmente registró
   * (no categorías fijas inventadas). Prioriza los datos del backend (/consumption/compare,
   * que ya agrupa por room_id real) y cae a los dispositivos locales si no hay conexión.
   */
  get ambientes(): DetalleAmbiente[] {
    const rate = 0.52;
    const habitaciones = this.stateService.habitacionesDeCasaSeleccionada;
    if (habitaciones.length === 0) return [];

    const kwhPorHabitacion = new Map<number, number>();
    const countPorHabitacion = new Map<number, number>();
    const devicesCasa = this.backendDevicesCasaSeleccionada;

    if (this.backendCompare && devicesCasa.length > 0) {
      devicesCasa.forEach(d => {
        if (!d.room_id) return;
        kwhPorHabitacion.set(d.room_id, (kwhPorHabitacion.get(d.room_id) || 0) + (d.total_kwh || 0));
        countPorHabitacion.set(d.room_id, (countPorHabitacion.get(d.room_id) || 0) + 1);
      });
    } else if (!this.backendCompare) {
      const term = this.searchTerm.toLowerCase().trim();
      this.devices
        .filter(d => !term || d.nombre.toLowerCase().includes(term) || d.tipo.toLowerCase().includes(term))
        .forEach(d => {
          if (!d.habitacionId) return;
          kwhPorHabitacion.set(d.habitacionId, (kwhPorHabitacion.get(d.habitacionId) || 0) + (d.consumoHoy || 0));
          countPorHabitacion.set(d.habitacionId, (countPorHabitacion.get(d.habitacionId) || 0) + 1);
        });
    }

    const totalKwh = Array.from(kwhPorHabitacion.values()).reduce((a, b) => a + b, 0);
    // Si usamos el backend, el kwh ya es el acumulado real (igual que totalMes del donut);
    // si es el fallback local, consumoHoy es un estimado diario y sí se proyecta a 30 días.
    const usandoBackend = !!this.backendCompare;

    return habitaciones.map((hab, idx) => {
      const kwh = kwhPorHabitacion.get(hab.id) || 0;
      const pct = totalKwh > 0 ? Math.round((kwh / totalKwh) * 100) : 0;
      const costo = usandoBackend ? kwh * rate : kwh * 30 * rate;
      return {
        habitacionId: hab.id,
        nombre: hab.name,
        dispositivos: countPorHabitacion.get(hab.id) || 0,
        costoMes: parseFloat(costo.toFixed(2)),
        porcentaje: pct,
        promedioKwh: parseFloat(kwh.toFixed(1)),
        color: PALETA_AMBIENTES[idx % PALETA_AMBIENTES.length],
        icon: this.iconForRoom(hab.name),
      };
    });
  }

  /** true si los números mostrados son el acumulado total de /consumption/compare (no un promedio diario). */
  get esConsumoAcumulado(): boolean {
    return !!this.backendCompare;
  }

  /**
   * Ranking real por dispositivo (pestaña "Por Dispositivo"), filtrado a la CASA SELECCIONADA.
   * No usamos el "percentage" que trae /consumption/compare porque ese es relativo a TODAS
   * las casas del usuario; aquí lo recalculamos sobre el total de la casa activa.
   */
  get dispositivosRanking(): { nombre: string; habitacion: string; kwh: number; costo: number; porcentaje: number }[] {
    const rate = 0.52;
    const devicesCasa = this.backendDevicesCasaSeleccionada;
    if (this.backendCompare && devicesCasa.length > 0) {
      const totalCasa = devicesCasa.reduce((acc, d) => acc + (d.total_kwh || 0), 0) || 1;
      return [...devicesCasa]
        .sort((a, b) => (b.total_kwh || 0) - (a.total_kwh || 0))
        .map(d => ({
          nombre: d.device_name,
          habitacion: d.room_name || 'Sin asignar',
          kwh: parseFloat((d.total_kwh || 0).toFixed(2)),
          costo: parseFloat(((d.total_kwh || 0) * rate).toFixed(2)),
          porcentaje: Math.round(((d.total_kwh || 0) / totalCasa) * 100),
        }));
    }

    const total = this.devices.reduce((acc, d) => acc + d.consumoHoy, 0) || 1;
    return [...this.devices]
      .sort((a, b) => b.consumoHoy - a.consumoHoy)
      .map(d => ({
        nombre: d.nombre,
        habitacion: d.ubicacion,
        kwh: parseFloat((d.consumoHoy * 30).toFixed(2)),
        costo: parseFloat((d.consumoHoy * 30 * rate).toFixed(2)),
        porcentaje: Math.round((d.consumoHoy / total) * 100),
      }));
  }

  /** Datos reales del donut (Chart.js), construidos a partir de las habitaciones reales del usuario. */
  get doughnutChartData(): ChartData<'doughnut'> {
    const amb = this.ambientes.filter(a => a.porcentaje > 0);
    if (amb.length === 0) {
      return { labels: ['Sin datos'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }] };
    }
    return {
      labels: amb.map(a => a.nombre),
      datasets: [{
        data: amb.map(a => a.promedioKwh),
        backgroundColor: amb.map(a => a.color),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 8,
        hoverBorderWidth: 0,
      }],
    };
  }

  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    cutout: '68%',
    radius: '90%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans' },
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} kWh`,
        },
      },
    },
  };

  /** Datos reales de la barra semanal (Chart.js), tomados de historialSemanal. */
  get barChartData(): ChartData<'bar'> {
    const dias = this.historialSemanal;
    return {
      labels: dias.map(d => d.dia),
      datasets: [{
        data: dias.map(d => d.total),
        backgroundColor: dias.map(d => d.isHoy ? '#0c5a47' : '#34d399'),
        hoverBackgroundColor: dias.map(d => d.isHoy ? '#0c5a47' : '#10b981'),
        borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false,
        maxBarThickness: 32,
      }],
    };
  }

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    maintainAspectRatio: false,
    layout: { padding: { top: 8 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
        bodyFont: { family: 'Plus Jakarta Sans' },
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} kWh`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 5 },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { font: { size: 12, weight: 'bold' }, color: '#64748b' },
      },
    },
  };

  /**
   * Últimos 7 días con el consumo REAL tomado de /consumption/history (no datos inventados),
   * filtrado a los dispositivos de la casa seleccionada. La altura de cada barra es relativa
   * al día de mayor consumo de la semana, para que sí se note la diferencia entre días.
   */
  get historialSemanal(): DiaConsumo[] {
    const dayLabels = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const habitacionIds = new Set(this.stateService.habitacionesDeCasaSeleccionada.map(h => h.id));
    const deviceIdToRoom = new Map<number, number>();
    this.devices.forEach(d => {
      if (d.backendId && d.habitacionId) deviceIdToRoom.set(d.backendId, d.habitacionId);
    });

    const hoy = new Date();
    const dias: { fecha: Date; clave: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      dias.push({ fecha, clave: fecha.toDateString() });
    }

    const totalesPorDia = new Map<string, number>();
    dias.forEach(d => totalesPorDia.set(d.clave, 0));

    this.historico.forEach(registro => {
      const roomId = deviceIdToRoom.get(registro.dispositivo_id);
      if (roomId === undefined || !habitacionIds.has(roomId)) return;
      const clave = new Date(registro.fecha_registro).toDateString();
      if (totalesPorDia.has(clave)) {
        totalesPorDia.set(clave, (totalesPorDia.get(clave) || 0) + (registro.kwh_consumidos || 0));
      }
    });

    const maxTotal = Math.max(1, ...Array.from(totalesPorDia.values()));
    const claveHoy = hoy.toDateString();

    return dias.map(d => {
      const total = parseFloat((totalesPorDia.get(d.clave) || 0).toFixed(2));
      return {
        dia: dayLabels[d.fecha.getDay()],
        total,
        alturaPct: Math.round((total / maxTotal) * 100),
        isHoy: d.clave === claveHoy,
      };
    });
  }

  readonly dispositivoRankingColumns = ['nombre', 'habitacion', 'kwh', 'costo', 'porcentaje'];

  /** Cantidad de registros de /consumption/history que pertenecen a dispositivos de la casa seleccionada. */
  private get registrosHistoricosCasaSeleccionada(): number {
    const habitacionIds = new Set(this.stateService.habitacionesDeCasaSeleccionada.map(h => h.id));
    const deviceIdToRoom = new Map<number, number>();
    this.devices.forEach(d => {
      if (d.backendId && d.habitacionId) deviceIdToRoom.set(d.backendId, d.habitacionId);
    });
    return this.historico.filter(r => {
      const roomId = deviceIdToRoom.get(r.dispositivo_id);
      return roomId !== undefined && habitacionIds.has(roomId);
    }).length;
  }

  /** Resumen para la pestaña "Reportes": acumulado total, mayor consumidor y nº de registros históricos, de la casa actual. */
  get reporteResumen(): { totalKwh: number; totalCosto: number; mayorConsumidor: string; registros: number } {
    const ranking = this.dispositivosRanking;
    return {
      totalKwh: parseFloat(ranking.reduce((acc, d) => acc + d.kwh, 0).toFixed(2)),
      totalCosto: this.totalMes,
      mayorConsumidor: ranking.length > 0 ? `${ranking[0].nombre} (${ranking[0].kwh} kWh)` : 'Sin datos',
      registros: this.registrosHistoricosCasaSeleccionada,
    };
  }

  exportData() {
    if (this.stateService.userRole === 'PERSONAL') {
      alert('La descarga de gráficos y reportes PDF es una función exclusiva del plan EcoVolt Empresarial. ¡Actualiza tu plan hoy para desbloquear esta característica!');
      return;
    }

    if (this.stateService.isBackendConnected) {
      this.apiService.downloadReportPdf().subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ecovolt-consumo-report.pdf';
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => alert('Error al exportar. Intente nuevamente.')
      });
    } else {
      alert('Exportando datos de consumo en formato CSV/Excel...');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
