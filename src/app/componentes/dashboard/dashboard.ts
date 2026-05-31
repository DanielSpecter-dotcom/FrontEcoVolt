import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

interface Dispositivo {
  id: string;
  nombre: string;
  ubicacion: string;
  estado: boolean;
  consumo: number;
  badge: string;
  badgeType: 'efficient' | 'eco' | 'constant' | 'standby' | 'off';
  icon: string;
}

interface Actividad {
  texto: string;
  tiempo: string;
  subtitulo: string;
  dotType: 'active' | 'inactive' | 'alert' | 'system';
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  userName = 'Carlos M.';
  userProfile = 'PREMIUM MEMBER';
  currentCity = 'LIMA, PERÚ';
  currentTemp = '24°C';

  // Símbolos generales de estado
  todayConsumption = 12.4;
  todayCost = 6.20;
  todayPercent = '8% más que ayer';
  todayPercentClass = 'percent-up'; // rojo

  monthlyConsumption = 284;
  monthlyCost = 142;
  monthlyPercent = '5% menos que abr.';
  monthlyPercentClass = 'percent-down'; // verde

  activeDevicesCount = 3;
  totalDevicesCount = 12;
  networkStatus = 'SISTEMA ÓPTIMO';

  isEcoModeActive = true;

  devices: Dispositivo[] = [
    { id: 'tv', nombre: 'TV Sala', ubicacion: 'SALA PRINCIPAL • ON', estado: true, consumo: 0.45, badge: 'EFICIENTE', badgeType: 'efficient', icon: 'tv' },
    { id: 'ac', nombre: 'Aire Acond.', ubicacion: 'DORMITORIO • ON', estado: true, consumo: 1.20, badge: 'MODO ECO', badgeType: 'eco', icon: 'ac' },
    { id: 'fridge', nombre: 'Refrigerador', ubicacion: 'COCINA • ON', estado: true, consumo: 2.80, badge: 'CONSTANTE', badgeType: 'constant', icon: 'fridge' },
    { id: 'washer', nombre: 'Lavadora', ubicacion: 'LAVANDERÍA • OFF', estado: false, consumo: 0.00, badge: 'STANDBY', badgeType: 'standby', icon: 'washer' },
    { id: 'lamp', nombre: 'Lámpara 1', ubicacion: 'ESTUDIO • OFF', estado: false, consumo: 0.00, badge: 'OFF', badgeType: 'off', icon: 'lamp' }
  ];

  activities: Actividad[] = [
    { texto: 'Aire Acondicionado encendido', tiempo: 'Hace 12 min', subtitulo: 'Rutina Noche', dotType: 'active' },
    { texto: 'TV Sala apagada', tiempo: 'Hace 45 min', subtitulo: 'Control Remoto', dotType: 'inactive' },
    { texto: 'Pico de consumo detectado', tiempo: 'Hoy, 14:30', subtitulo: 'Lavandería', dotType: 'alert' },
    { texto: 'Lámpara Estudio apagada', tiempo: 'Hoy, 13:15', subtitulo: 'Automático', dotType: 'inactive' },
    { texto: 'Sistema actualizado v2.4', tiempo: 'Hoy, 09:00', subtitulo: 'Sistema', dotType: 'system' }
  ];

  constructor(private router: Router) {
    this.recalculateActiveCount();
  }

  toggleDevice(device: Dispositivo) {
    device.estado = !device.estado;
    if (device.estado) {
      device.ubicacion = device.ubicacion.replace('• OFF', '• ON');
      // consumo por defecto
      if (device.id === 'tv') { device.consumo = 0.45; device.badge = 'EFICIENTE'; device.badgeType = 'efficient'; }
      else if (device.id === 'ac') { device.consumo = this.isEcoModeActive ? 0.95 : 1.20; device.badge = this.isEcoModeActive ? 'MODO ECO' : 'EFICIENTE'; device.badgeType = this.isEcoModeActive ? 'eco' : 'efficient'; }
      else if (device.id === 'fridge') { device.consumo = 2.80; device.badge = 'CONSTANTE'; device.badgeType = 'constant'; }
      else if (device.id === 'washer') { device.consumo = 1.80; device.badge = 'EFICIENTE'; device.badgeType = 'efficient'; }
      else if (device.id === 'lamp') { device.consumo = 0.05; device.badge = 'EFICIENTE'; device.badgeType = 'efficient'; }
      
      this.logActivity(`${device.nombre} encendido`, 'Control Manual', 'active');
    } else {
      device.ubicacion = device.ubicacion.replace('• ON', '• OFF');
      device.consumo = 0.00;
      device.badge = device.id === 'washer' ? 'STANDBY' : 'OFF';
      device.badgeType = device.id === 'washer' ? 'standby' : 'off';
      this.logActivity(`${device.nombre} apagado`, 'Control Manual', 'inactive');
    }
    this.recalculateActiveCount();
    this.recalculateConsumption();
  }

  toggleEcoMode() {
    this.isEcoModeActive = !this.isEcoModeActive;
    
    // Si el modo eco se activa, reduce consumo de dispositivos de alta potencia
    this.devices.forEach(device => {
      if (device.estado && device.id === 'ac') {
        if (this.isEcoModeActive) {
          device.consumo = 0.95;
          device.badge = 'MODO ECO';
          device.badgeType = 'eco';
        } else {
          device.consumo = 1.20;
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
  }

  applyScene(scene: string) {
    if (scene === 'night') {
      // Modo Noche: apaga todo excepto refrigerador
      this.devices.forEach(d => {
        if (d.id !== 'fridge' && d.estado) {
          d.estado = false;
          d.ubicacion = d.ubicacion.replace('• ON', '• OFF');
          d.consumo = 0.00;
          d.badge = d.id === 'washer' ? 'STANDBY' : 'OFF';
          d.badgeType = d.id === 'washer' ? 'standby' : 'off';
        }
      });
      this.logActivity('Escena Modo Noche aplicada', 'Escenas Rápidas', 'active');
    } else if (scene === 'work') {
      // Modo Trabajo: enciende lámpara
      this.devices.forEach(d => {
        if (d.id === 'lamp' && !d.estado) {
          d.estado = true;
          d.ubicacion = d.ubicacion.replace('• OFF', '• ON');
          d.consumo = 0.05;
          d.badge = 'EFICIENTE';
          d.badgeType = 'efficient';
        }
      });
      this.logActivity('Escena Modo Trabajo aplicada', 'Escenas Rápidas', 'active');
    } else if (scene === 'off') {
      // Todo Apagado: apaga absolutamente todo
      this.devices.forEach(d => {
        if (d.estado) {
          d.estado = false;
          d.ubicacion = d.ubicacion.replace('• ON', '• OFF');
          d.consumo = 0.00;
          d.badge = d.id === 'washer' ? 'STANDBY' : 'OFF';
          d.badgeType = d.id === 'washer' ? 'standby' : 'off';
        }
      });
      this.logActivity('Cierre total: Todo apagado', 'Escenas Rápidas', 'alert');
    }
    this.recalculateActiveCount();
    this.recalculateConsumption();
  }

  private recalculateActiveCount() {
    const active = this.devices.filter(d => d.estado).length;
    this.activeDevicesCount = active;
  }

  private recalculateConsumption() {
    // Calcular suma del consumo de los dispositivos encendidos
    let sum = 0;
    this.devices.forEach(d => sum += d.consumo);
    
    // Simular que el consumo base + los activos sumen hoy
    // Suma base de 8 kWh + el de los activos
    this.todayConsumption = parseFloat((8.0 + sum).toFixed(1));
    this.todayCost = parseFloat((this.todayConsumption * 0.5).toFixed(2));
    
    // Si baja el consumo, cambia el indicador de consumo diario
    if (this.todayConsumption < 11.5) {
      this.todayPercent = '4% menos que ayer';
      this.todayPercentClass = 'percent-down'; // verde
    } else {
      this.todayPercent = '8% más que ayer';
      this.todayPercentClass = 'percent-up'; // rojo
    }
  }

  private logActivity(texto: string, subtitulo: string, dotType: 'active' | 'inactive' | 'alert' | 'system') {
    this.activities.unshift({
      texto,
      tiempo: 'Ahora mismo',
      subtitulo,
      dotType
    });
    // Limitar feed a 8 elementos
    if (this.activities.length > 8) {
      this.activities.pop();
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
