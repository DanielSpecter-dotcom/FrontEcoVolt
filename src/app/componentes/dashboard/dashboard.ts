import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService, Dispositivo, Actividad } from '../../servicios/state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
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
  showAddModal = false;
  newNombre = '';
  newTipo = 'Luz';
  newUbicacion = '';
  newCarga = '';
  newModo: 'AUTO' | 'MANUAL' = 'AUTO';
  tiposDisponibles = ['Luz', 'TV', 'Refrigerador', 'AC', 'Lavadora', 'Cafetera', 'Otro'];

  isEcoModeActive = true;

  constructor(
    private router: Router,
    public stateService: StateService
  ) {
    this.stateService.loadState();
    this.recalculateConsumption();
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
      return this.stateService.devices;
    }
    const term = this.dashSearchTerm.toLowerCase();
    return this.stateService.devices.filter(d => d.nombre.toLowerCase().includes(term));
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
    device.estado = !device.estado;
    if (device.estado) {
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
      this.todayConsumption = 0;
      this.todayCost = 0;
      this.todayPercent = 'Sin consumo registrado';
      this.todayPercentClass = 'percent-down';
      this.monthlyConsumption = 0;
      this.monthlyCost = 0;
      this.monthlyPercent = 'Sin consumo registrado';
      this.monthlyPercentClass = 'percent-down';
      this.networkStatus = 'SISTEMA ÓPTIMO - SIN DISPOSITIVOS';
      return;
    }

    this.networkStatus = 'SISTEMA ÓPTIMO';

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
    this.showAddModal = true;
    this.newNombre = '';
    this.newTipo = 'Luz';
    this.newUbicacion = '';
    this.newCarga = '';
    this.newModo = 'AUTO';
  }

  closeModal() {
    this.showAddModal = false;
  }

  addDevice() {
    if (!this.newNombre.trim() || !this.newUbicacion.trim() || !this.newCarga.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    let powerStr = this.newCarga.trim().toUpperCase();
    if (!powerStr.endsWith('W') && !powerStr.endsWith('KW')) {
      powerStr += 'W';
    }

    const newId = 'dev_' + Date.now();
    const watts = parseInt(powerStr.replace(/\D/g, '')) || 100;
    const estimatedKwh = parseFloat(((watts * 4) / 1000).toFixed(2));

    const iconMap: { [key: string]: string } = {
      'Luz': 'lamp',
      'TV': 'tv',
      'Refrigerador': 'fridge',
      'AC': 'ac',
      'Lavadora': 'washer',
      'Cafetera': 'coffee',
      'Otro': 'other'
    };

    const newDev: Dispositivo = {
      id: newId,
      nombre: this.newNombre,
      tipo: this.newTipo,
      ubicacion: this.newUbicacion,
      carga: powerStr,
      estado: true,
      consumoHoy: estimatedKwh,
      modo: this.newModo,
      badge: 'EFICIENTE',
      badgeType: 'efficient',
      icon: iconMap[this.newTipo] || 'other'
    };

    this.stateService.devices.push(newDev);
    this.stateService.addNotification(`Nuevo dispositivo registrado: ${newDev.nombre}`);
    this.logActivity(`Nuevo dispositivo registrado: ${newDev.nombre}`, 'Dispositivos', 'system');
    this.recalculateConsumption();
    this.stateService.saveStateToStorage();
    this.closeModal();
  }

  downloadReport() {
    alert('Preparando y descargando tu reporte de consumo energético semanal en PDF...');
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
