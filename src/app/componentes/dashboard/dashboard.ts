import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { StateService } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';
import { Dispositivo, Actividad, ActividadPanelDto, ResumenPanelDto } from '../../modelos';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  /** Refresca el estado de los dispositivos cada 30s para reflejar cambios hechos por rutinas automáticas. */
  private pollSub?: Subscription;
  private readonly POLL_INTERVAL_MS = 30000;

  // Dropdown states
  showProfileMenu = false;
  showNotifications = false;

  // Search state
  dashSearchTerm = '';

  // Chatbot state
  isChatOpen = false;
  chatInput = '';
  chatMessages: { sender: 'bot' | 'user'; text: string; time: string }[] = [
    { sender: 'bot', text: '¡Hola! Soy tu coach de eficiencia Eco-IA. ¿En qué te puedo asesorar hoy para optimizar tu consumo?', time: 'Ahora' }
  ];

  // Device Form state
  isEcoModeActive = true;

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Load data from backend if connected
    if (this.stateService.isBackendConnected) {
      this.loadDashboardData();
    } else {
      // Try loading from backend
      this.stateService.loadFromBackend().then((success) => {
        if (success) {
          this.loadDashboardData();
        } else {
          this.recalculateConsumption();
        }
      });
    }
    this.recalculateConsumption();
    this.startPolling();
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  /** Vuelve a pedir los dispositivos periódicamente para reflejar cambios de estado hechos por rutinas automáticas en el backend. */
  private startPolling() {
    this.pollSub = interval(this.POLL_INTERVAL_MS)
      .pipe(
        filter(() => this.stateService.isBackendConnected),
        switchMap(() => this.apiService.getDevices())
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.stateService.devices = res.data.map(d => this.stateService.mapDeviceFromBackend(d));
            this.recalculateConsumption();
            this.stateService.saveStateToStorage();
          }
        },
        error: () => {} // Mantener los datos actuales y reintentar en el próximo ciclo
      });
  }

  private loadDashboardData() {
    // Load dashboard summary (KPIs)
    this.apiService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.todayConsumption = res.data.consumoDiarioKwh || 0;
          this.todayCost = parseFloat((this.todayConsumption * 0.52).toFixed(2));
          this.monthlyConsumption = res.data.consumoMensualKwh || 0;
          this.monthlyCost = res.data.costoEstimadoSoles || 0;

          const variation = res.data.variacionPorcentaje || 0;
          if (variation < 0) {
            this.todayPercent = `${Math.abs(variation)}% menos que ayer`;
            this.todayPercentClass = 'percent-down';
          } else {
            this.todayPercent = `${variation}% más que ayer`;
            this.todayPercentClass = 'percent-up';
          }
          this.monthlyPercent = `${Math.abs(variation)}% variación mensual`;
          this.monthlyPercentClass = variation <= 0 ? 'percent-down' : 'percent-up';
        }
      },
      error: () => this.recalculateConsumption()
    });

    // Load activity feed
    this.apiService.getDashboardActivity().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.stateService.activities = res.data.map((a: ActividadPanelDto) => ({
            texto: a.descripcion,
            tiempo: this.formatActivityTime(a.hora),
            subtitulo: a.tipo || 'Sistema',
            dotType: this.mapActivityType(a.tipo)
          }));
        }
      },
      error: () => {} // Keep existing activities
    });
  }

  private formatActivityTime(hora: string): string {
    if (!hora) return 'Hace un momento';
    try {
      const d = new Date(hora);
      const now = new Date();
      const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
      if (diffMin < 1) return 'Ahora mismo';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffMin < 1440) return `Hoy, ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      return d.toLocaleDateString('es-ES');
    } catch {
      return hora;
    }
  }

  private mapActivityType(tipo: string): 'active' | 'inactive' | 'alert' | 'system' {
    if (!tipo) return 'system';
    const t = tipo.toLowerCase();
    if (t.includes('encend') || t.includes('activ') || t.includes('on')) return 'active';
    if (t.includes('apag') || t.includes('off')) return 'inactive';
    if (t.includes('alert') || t.includes('pico')) return 'alert';
    return 'system';
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

  navigateToAlertas() {
    this.showNotifications = false;
    this.router.navigate(['/alertas']);
  }

  // Getters connected to StateService
  get userName(): string {
    return this.stateService.usuario.nombre;
  }

  get userProfile(): string {
    return this.stateService.usuario.plan;
  }

  get userAvatar(): string | null {
    return this.stateService.usuario.avatar;
  }

  get currentCity(): string {
    return this.stateService.usuario.ciudad.toUpperCase();
  }

  get currentTemp(): string {
    const city = this.stateService.usuario.ciudad.toLowerCase();
    if (city.includes('lima')) return '19°C';
    if (city.includes('bogotá') || city.includes('bogota')) return '14°C';
    if (city.includes('santiago')) return '12°C';
    if (city.includes('buenos aires') || city.includes('buenosaires')) return '15°C';
    if (city.includes('méxico') || city.includes('mexico')) return '21°C';
    return '20°C';
  }

  get devices(): Dispositivo[] {
    if (!this.dashSearchTerm.trim()) {
      return this.stateService.dispositivosDeCasaSeleccionada;
    }
    const term = this.dashSearchTerm.toLowerCase();
    return this.stateService.dispositivosDeCasaSeleccionada.filter(d => d.nombre.toLowerCase().includes(term));
  }

  get activities(): Actividad[] {
    return this.stateService.activities;
  }

  // Símbolos generales de estado
  todayConsumption = 0;
  todayCost = 0;
  todayPercent = '0% de variación';
  todayPercentClass = 'percent-down';

  monthlyConsumption = 0;
  monthlyCost = 0;
  monthlyPercent = '0% de variación';
  monthlyPercentClass = 'percent-down';

  activeDevicesCount = 0;
  totalDevicesCount = 0;
  networkStatus = 'SISTEMA ÓPTIMO';

  toggleDevice(device: Dispositivo) {
    const newStatus = !device.estado;

    // Optimistic update
    device.estado = newStatus;
    if (newStatus) {
      let powerVal = parseInt(device.carga.replace(/\D/g, '')) || 100;
      device.consumoHoy = parseFloat(((powerVal * 4) / 1000).toFixed(2));
      device.badge = 'ON';
      device.badgeType = 'efficient';
      this.logActivity(`${device.nombre} encendido`, 'Control Manual', 'active');
    } else {
      device.consumoHoy = 0.00;
      device.badge = 'OFF';
      device.badgeType = 'off';
      this.logActivity(`${device.nombre} apagado`, 'Control Manual', 'inactive');
    }
    this.recalculateConsumption();
    this.stateService.saveStateToStorage();

    // Sync with backend
    if (device.backendId && this.stateService.isBackendConnected) {
      this.apiService.toggleDeviceStatus(device.backendId, newStatus ? 'ON' : 'OFF').subscribe({
        error: (err) => console.warn('Error syncing device status:', err)
      });
    }
  }

  toggleEcoMode() {
    this.isEcoModeActive = !this.isEcoModeActive;

    this.devices.forEach(device => {
      if (device.estado) {
        if (this.isEcoModeActive) {
          device.consumoHoy = parseFloat((device.consumoHoy * 0.8).toFixed(2));
          device.badge = 'MODO ECO';
          device.badgeType = 'eco';
        } else {
          let powerVal = parseInt(device.carga.replace(/\D/g, '')) || 100;
          device.consumoHoy = parseFloat(((powerVal * 4) / 1000).toFixed(2));
          device.badge = 'EFICIENTE';
          device.badgeType = 'efficient';
        }
      }
    });

    this.logActivity(
      this.isEcoModeActive ? 'Modo Eco-Ahorro activado' : 'Modo Eco-Ahorro desactivado',
      'Configuración',
      this.isEcoModeActive ? 'active' : 'system'
    );
    this.recalculateConsumption();
    this.stateService.saveStateToStorage();
  }

  applyScene(scene: string) {
    if (this.devices.length === 0) {
      alert('No hay dispositivos registrados para aplicar escenas.');
      return;
    }

    if (scene === 'night') {
      this.devices.forEach(d => {
        if (!d.nombre.toLowerCase().includes('refrig') && d.estado) {
          d.estado = false;
          d.consumoHoy = 0.00;
          d.badge = 'OFF';
          d.badgeType = 'off';
          // Sync with backend
          if (d.backendId && this.stateService.isBackendConnected) {
            this.apiService.toggleDeviceStatus(d.backendId, 'OFF').subscribe();
          }
        }
      });
      this.logActivity('Escena Modo Noche aplicada', 'Escenas Rápidas', 'active');
    } else if (scene === 'work') {
      this.devices.forEach(d => {
        if (d.tipo.toLowerCase().includes('luz') || d.nombre.toLowerCase().includes('lámpara') || d.nombre.toLowerCase().includes('lampara')) {
          if (!d.estado) {
            d.estado = true;
            let powerVal = parseInt(d.carga.replace(/\D/g, '')) || 60;
            d.consumoHoy = parseFloat(((powerVal * 4) / 1000).toFixed(2));
            d.badge = 'ON';
            d.badgeType = 'efficient';
            if (d.backendId && this.stateService.isBackendConnected) {
              this.apiService.toggleDeviceStatus(d.backendId, 'ON').subscribe();
            }
          }
        }
      });
      this.logActivity('Escena Modo Trabajo aplicada', 'Escenas Rápidas', 'active');
    } else if (scene === 'off') {
      this.devices.forEach(d => {
        if (d.estado) {
          d.estado = false;
          d.consumoHoy = 0.00;
          d.badge = 'OFF';
          d.badgeType = 'off';
          if (d.backendId && this.stateService.isBackendConnected) {
            this.apiService.toggleDeviceStatus(d.backendId, 'OFF').subscribe();
          }
        }
      });
      this.logActivity('Cierre total: Todo apagado', 'Escenas Rápidas', 'alert');
    }
    this.recalculateConsumption();
    this.stateService.saveStateToStorage();
  }

  recalculateConsumption() {
    this.totalDevicesCount = this.stateService.devices.length;
    this.activeDevicesCount = this.stateService.devices.filter(d => d.estado).length;

    if (this.totalDevicesCount === 0) {
      this.todayConsumption = this.todayConsumption || 0;
      this.todayCost = this.todayCost || 0;
      this.todayPercent = this.todayPercent || 'Sin consumo registrado';
      this.todayPercentClass = 'percent-down';
      this.monthlyConsumption = this.monthlyConsumption || 0;
      this.monthlyCost = this.monthlyCost || 0;
      this.monthlyPercent = this.monthlyPercent || 'Sin consumo registrado';
      this.monthlyPercentClass = 'percent-down';
      this.networkStatus = this.stateService.isBackendConnected ? 'CONECTADO AL SERVIDOR' : 'SISTEMA ÓPTIMO - SIN DISPOSITIVOS';
      return;
    }

    this.networkStatus = this.stateService.isBackendConnected ? 'CONECTADO AL SERVIDOR' : 'SISTEMA ÓPTIMO';

    // Only recalculate from local data if backend hasn't provided KPIs
    if (!this.stateService.isBackendConnected) {
      let sum = 0;
      this.stateService.devices.forEach(d => sum += d.consumoHoy);

      this.todayConsumption = parseFloat((4.0 + sum).toFixed(1));
      this.todayCost = parseFloat((this.todayConsumption * 0.52).toFixed(2));

      this.monthlyConsumption = parseFloat((120.0 + (sum * 30)).toFixed(1));
      this.monthlyCost = parseFloat((this.monthlyConsumption * 0.52).toFixed(2));

      if (this.todayConsumption < 8.0) {
        this.todayPercent = '12% menos que ayer';
        this.todayPercentClass = 'percent-down';
      } else {
        this.todayPercent = '5% más que ayer';
        this.todayPercentClass = 'percent-up';
      }

      this.monthlyPercent = '8% menos que el mes ant.';
      this.monthlyPercentClass = 'percent-down';
    }
  }

  logActivity(texto: string, subtitulo: string, dotType: 'active' | 'inactive' | 'alert' | 'system') {
    this.activities.unshift({
      texto,
      tiempo: 'Ahora mismo',
      subtitulo,
      dotType
    });
    if (this.activities.length > 8) {
      this.activities.pop();
    }
  }

  // Chatbot operations
  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  sendChatMessage() {
    if (!this.chatInput.trim()) return;

    const userText = this.chatInput.trim();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.chatMessages.push({
      sender: 'user',
      text: userText,
      time: timeStr
    });

    this.chatInput = '';

    setTimeout(() => {
      let replyText = 'Entiendo. Estoy analizando tu perfil energético... ';
      const query = userText.toLowerCase();

      if (query.includes('ahorr') || query.includes('reduc') || query.includes('consejo') || query.includes('tip')) {
        replyText = 'Para reducir tu planilla eléctrica, te sugiero apagar las luces en zonas vacías y configurar el Aire Acondicionado en 24°C, lo cual optimiza un 15% de su gasto energético.';
      } else if (query.includes('dispositivo') || query.includes('conectar') || query.includes('equipo')) {
        if (this.devices.length === 0) {
          replyText = 'Actualmente no tienes dispositivos en tu red virtual de EcoVolt. Prueba agregando uno con el botón "AGREGAR" arriba del control de dispositivos.';
        } else {
          replyText = `Tienes ${this.devices.length} dispositivos en tu red. El de mayor consumo estimado es ${this.getHeavyDeviceName()}.`;
        }
      } else if (query.includes('hola') || query.includes('buenos') || query.includes('tardes')) {
        replyText = `¡Hola ${this.userName}! Soy tu asistente inteligente Eco-IA. Estoy listo para ayudarte a monitorear y reducir tus consumos de energía. ¿Qué deseas consultar hoy?`;
      } else {
        replyText = 'Excelente consulta. Te comento que programar rutinas de apagado automático a las 11:00 PM (Modo Noche) es la forma más rápida de evitar el consumo fantasma de energía.';
      }

      this.chatMessages.push({
        sender: 'bot',
        text: replyText,
        time: timeStr
      });
    }, 600);
  }

  private getHeavyDeviceName(): string {
    if (this.devices.length === 0) return 'ninguno';
    let max = this.devices[0];
    this.devices.forEach(d => {
      const w1 = parseInt(d.carga.replace(/\D/g, '')) || 0;
      const wMax = parseInt(max.carga.replace(/\D/g, '')) || 0;
      if (w1 > wMax) max = d;
    });
    return `${max.nombre} (${max.carga})`;
  }

  // Device addition modal operations
  openAddModal() {
    this.router.navigate(['/dispositivos'], { queryParams: { openAdd: 'true' } });
  }

  downloadReport() {
    if (this.stateService.isBackendConnected) {
      this.apiService.downloadReportPdf().subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ecovolt-report.pdf';
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => alert('Error al descargar el reporte. Intente nuevamente.')
      });
    } else {
      alert('Preparando y descargando tu reporte de consumo energético semanal en PDF...');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
