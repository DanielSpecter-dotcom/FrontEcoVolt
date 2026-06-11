import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService, Dispositivo } from '../../servicios/state.service';
import { ApiService, ComparacionConsumoRespuestaDto, ConsumoHabitacionDTO } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';

interface DetalleAmbiente {
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
  sala: number;
  cocina: number;
  dormitorio: number;
  lavanderia: number;
  total: number;
  isHoy?: boolean;
}

@Component({
  selector: 'app-consumo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consumo.html',
  styleUrl: './consumo.css',
})
export class Consumo implements OnInit {
  // Dropdown states
  showProfileMenu = false;
  showNotifications = false;

  activeTab: 'dispositivo' | 'ambiente' | 'reporte' | 'comparativa' = 'ambiente';
  activeTimeframe: 'dia' | 'semana' | 'mes' = 'semana';
  searchTerm = '';

  // Backend data
  backendCompare: ComparacionConsumoRespuestaDto | null = null;

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.stateService.isBackendConnected) {
      this.loadConsumptionData();
    } else {
      this.stateService.loadFromBackend().then((success) => {
        if (success) this.loadConsumptionData();
      });
    }
  }

  private loadConsumptionData() {
    // Load consumption comparison
    this.apiService.getConsumptionCompare().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.backendCompare = res.data;
        }
      },
      error: () => {} // Use local calculations
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
    return this.stateService.devices;
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

  get totalMes(): number {
    if (this.backendCompare) {
      return parseFloat((this.backendCompare.total_kwh * 0.52).toFixed(2));
    }
    const total = this.devices.reduce((acc, curr) => acc + curr.consumoHoy, 0);
    return parseFloat((total * 30 * 0.52).toFixed(2));
  }

  get roomStats() {
    // If we have backend comparison data, use it
    if (this.backendCompare && this.backendCompare.devices.length > 0) {
      const stats: any = {
        sala: { kwh: 0, count: 0, pct: 0 },
        cocina: { kwh: 0, count: 0, pct: 0 },
        dormitorio: { kwh: 0, count: 0, pct: 0 },
        lavanderia: { kwh: 0, count: 0, pct: 0 }
      };
      const totalKwh = this.backendCompare.total_kwh || 1;

      this.backendCompare.devices.forEach(d => {
        const room = (d.room_name || '').toLowerCase();
        if (room.includes('sala')) { stats.sala.kwh += d.total_kwh; stats.sala.count++; }
        else if (room.includes('cocina')) { stats.cocina.kwh += d.total_kwh; stats.cocina.count++; }
        else if (room.includes('dormitorio') || room.includes('hab')) { stats.dormitorio.kwh += d.total_kwh; stats.dormitorio.count++; }
        else if (room.includes('lavand')) { stats.lavanderia.kwh += d.total_kwh; stats.lavanderia.count++; }
        else { stats.sala.kwh += d.total_kwh; stats.sala.count++; }
      });

      stats.sala.pct = totalKwh > 0 ? Math.round((stats.sala.kwh / totalKwh) * 100) : 0;
      stats.cocina.pct = totalKwh > 0 ? Math.round((stats.cocina.kwh / totalKwh) * 100) : 0;
      stats.dormitorio.pct = totalKwh > 0 ? Math.round((stats.dormitorio.kwh / totalKwh) * 100) : 0;
      stats.lavanderia.pct = Math.max(0, 100 - (stats.sala.pct + stats.cocina.pct + stats.dormitorio.pct));

      return stats;
    }

    // Fallback: local calculation
    let totalKwh = 0;
    const stats = {
      sala: { kwh: 0, count: 0, pct: 0 },
      cocina: { kwh: 0, count: 0, pct: 0 },
      dormitorio: { kwh: 0, count: 0, pct: 0 },
      lavanderia: { kwh: 0, count: 0, pct: 0 }
    };

    const term = this.searchTerm.toLowerCase().trim();
    const filtered = this.devices.filter(d => 
      !term || 
      d.nombre.toLowerCase().includes(term) ||
      d.ubicacion.toLowerCase().includes(term) ||
      d.tipo.toLowerCase().includes(term)
    );

    filtered.forEach(d => {
      const room = d.ubicacion.toLowerCase();
      const kwh = d.consumoHoy;
      totalKwh += kwh;
      if (room.includes('sala')) { stats.sala.kwh += kwh; stats.sala.count++; }
      else if (room.includes('cocina')) { stats.cocina.kwh += kwh; stats.cocina.count++; }
      else if (room.includes('dormitorio') || room.includes('hab')) { stats.dormitorio.kwh += kwh; stats.dormitorio.count++; }
      else if (room.includes('lavand')) { stats.lavanderia.kwh += kwh; stats.lavanderia.count++; }
      else { stats.sala.kwh += kwh; stats.sala.count++; }
    });

    if (totalKwh > 0) {
      stats.sala.pct = Math.round((stats.sala.kwh / totalKwh) * 100);
      stats.cocina.pct = Math.round((stats.cocina.kwh / totalKwh) * 100);
      stats.dormitorio.pct = Math.round((stats.dormitorio.kwh / totalKwh) * 100);
      stats.lavanderia.pct = 100 - (stats.sala.pct + stats.cocina.pct + stats.dormitorio.pct);
      if (stats.lavanderia.pct < 0) stats.lavanderia.pct = 0;
    }

    return stats;
  }

  get ambientes(): DetalleAmbiente[] {
    const stats = this.roomStats;
    const rate = 0.52;
    return [
      { nombre: 'Sala de Estar', dispositivos: stats.sala.count, costoMes: parseFloat((stats.sala.kwh * 30 * rate).toFixed(2)), porcentaje: stats.sala.pct, promedioKwh: parseFloat(stats.sala.kwh.toFixed(1)), color: '#0d9488', icon: 'sofa' },
      { nombre: 'Cocina', dispositivos: stats.cocina.count, costoMes: parseFloat((stats.cocina.kwh * 30 * rate).toFixed(2)), porcentaje: stats.cocina.pct, promedioKwh: parseFloat(stats.cocina.kwh.toFixed(1)), color: '#16a34a', icon: 'utensils' },
      { nombre: 'Dormitorio Principal', dispositivos: stats.dormitorio.count, costoMes: parseFloat((stats.dormitorio.kwh * 30 * rate).toFixed(2)), porcentaje: stats.dormitorio.pct, promedioKwh: parseFloat(stats.dormitorio.kwh.toFixed(1)), color: '#4ade80', icon: 'bed' },
      { nombre: 'Lavandería', dispositivos: stats.lavanderia.count, costoMes: parseFloat((stats.lavanderia.kwh * 30 * rate).toFixed(2)), porcentaje: stats.lavanderia.pct, promedioKwh: parseFloat(stats.lavanderia.kwh.toFixed(1)), color: '#2dd4bf', icon: 'washer' }
    ];
  }

  get historialSemanal(): DiaConsumo[] {
    const days = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
    const stats = this.roomStats;
    const hasDevices = this.devices.length > 0;
    
    let tfMultiplier = 1;
    if (this.activeTimeframe === 'dia') tfMultiplier = 0.2;
    if (this.activeTimeframe === 'mes') tfMultiplier = 4.3;

    return days.map((day, idx) => {
      let dayVar = 1.0;
      if (day === 'SAB' || day === 'DOM') dayVar = 1.25;
      else if (day === 'LUN' || day === 'MAR') dayVar = 0.9;
      
      const multiplier = !hasDevices ? 0 : dayVar * tfMultiplier;
      
      const sala = stats.sala.kwh * multiplier;
      const cocina = stats.cocina.kwh * multiplier;
      const dormitorio = stats.dormitorio.kwh * multiplier;
      const lavanderia = stats.lavanderia.kwh * multiplier;
      const total = sala + cocina + dormitorio + lavanderia;

      return {
        dia: day,
        sala: parseFloat(sala.toFixed(1)),
        cocina: parseFloat(cocina.toFixed(1)),
        dormitorio: parseFloat(dormitorio.toFixed(1)),
        lavanderia: parseFloat(lavanderia.toFixed(1)),
        total: parseFloat(total.toFixed(1)),
        isHoy: idx === 2
      };
    });
  }

  exportData() {
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
