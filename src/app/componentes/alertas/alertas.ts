import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

interface Alerta {
  id: string;
  tipo: 'CRITICA' | 'ADVERTENCIA' | 'INFO';
  titulo: string;
  descripcion: string;
  dispositivo: string;
  icono: string;
  fecha: string;
  hora: string;
  leida: boolean;
  activa: boolean;
}

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css',
})
export class Alertas {
  filtroActivo: 'TODAS' | 'CRITICA' | 'ADVERTENCIA' | 'INFO' | 'NO_LEIDAS' = 'TODAS';
  busqueda = '';
  mostrarModal = false;
  alertaSeleccionada: Alerta | null = null;

  alertas: Alerta[] = [
    {
      id: '1',
      tipo: 'CRITICA',
      titulo: 'Consumo Excesivo Detectado',
      descripcion: 'El aire acondicionado ha superado el umbral de consumo diario permitido (15 kWh). Se recomienda reducir la temperatura o apagar el dispositivo.',
      dispositivo: 'Aire Acondicionado Sala',
      icono: 'ac',
      fecha: 'Hoy',
      hora: '14:32',
      leida: false,
      activa: true
    },
    {
      id: '2',
      tipo: 'ADVERTENCIA',
      titulo: 'Dispositivo sin respuesta',
      descripcion: 'La lavadora no responde a los comandos enviados en los últimos 10 minutos. Verifique la conexión de red o el estado físico del dispositivo.',
      dispositivo: 'Lavadora Samsung',
      icono: 'washer',
      fecha: 'Hoy',
      hora: '12:15',
      leida: false,
      activa: true
    },
    {
      id: '3',
      tipo: 'INFO',
      titulo: 'Rutina ejecutada exitosamente',
      descripcion: 'La rutina "Modo Noche" se ejecutó correctamente a las 11:00 PM. Todos los dispositivos fueron apagados según la programación.',
      dispositivo: 'Sistema de Rutinas',
      icono: 'routine',
      fecha: 'Hoy',
      hora: '11:00',
      leida: true,
      activa: false
    },
    {
      id: '4',
      tipo: 'ADVERTENCIA',
      titulo: 'Batería de respaldo baja',
      descripcion: 'El sistema de batería solar tiene un nivel inferior al 20%. Si el consumo continúa, el sistema cambiará a red eléctrica en las próximas horas.',
      dispositivo: 'Panel Solar EcoVolt',
      icono: 'solar',
      fecha: 'Ayer',
      hora: '09:45',
      leida: true,
      activa: false
    },
    {
      id: '5',
      tipo: 'CRITICA',
      titulo: 'Pico de voltaje detectado',
      descripcion: 'Se detectó un pico de voltaje de 250V en el circuito principal. El dispositivo de protección se activó automáticamente para prevenir daños.',
      dispositivo: 'Circuito Principal',
      icono: 'lightning',
      fecha: 'Ayer',
      hora: '03:22',
      leida: true,
      activa: false
    },
    {
      id: '6',
      tipo: 'INFO',
      titulo: 'Actualización de firmware disponible',
      descripcion: 'Hay una nueva actualización de firmware (v2.3.1) disponible para el termostato inteligente. Se recomienda actualizar para mejorar la eficiencia.',
      dispositivo: 'Termostato Inteligente',
      icono: 'thermostat',
      fecha: 'Hace 2 días',
      hora: '10:00',
      leida: true,
      activa: false
    },
    {
      id: '7',
      tipo: 'INFO',
      titulo: 'Meta de ahorro alcanzada',
      descripcion: 'Has alcanzado tu meta mensual de ahorro energético: 120 kWh ahorrados este mes. ¡Sigue así para mantener tu huella de carbono reducida!',
      dispositivo: 'Sistema EcoVolt',
      icono: 'leaf',
      fecha: 'Hace 3 días',
      hora: '08:00',
      leida: true,
      activa: false
    }
  ];

  get alertasFiltradas(): Alerta[] {
    return this.alertas.filter(a => {
      const matchFiltro =
        this.filtroActivo === 'TODAS' ? true :
        this.filtroActivo === 'NO_LEIDAS' ? !a.leida :
        a.tipo === this.filtroActivo;

      const matchBusqueda = this.busqueda.trim() === '' ||
        a.titulo.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        a.dispositivo.toLowerCase().includes(this.busqueda.toLowerCase());

      return matchFiltro && matchBusqueda;
    });
  }

  get totalCriticas(): number {
    return this.alertas.filter(a => a.tipo === 'CRITICA').length;
  }

  get totalAdvertencias(): number {
    return this.alertas.filter(a => a.tipo === 'ADVERTENCIA').length;
  }

  get totalNoLeidas(): number {
    return this.alertas.filter(a => !a.leida).length;
  }

  get totalInfo(): number {
    return this.alertas.filter(a => a.tipo === 'INFO').length;
  }

  setFiltro(filtro: 'TODAS' | 'CRITICA' | 'ADVERTENCIA' | 'INFO' | 'NO_LEIDAS') {
    this.filtroActivo = filtro;
  }

  verDetalle(alerta: Alerta) {
    alerta.leida = true;
    this.alertaSeleccionada = alerta;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.alertaSeleccionada = null;
  }

  marcarLeida(alerta: Alerta) {
    alerta.leida = true;
  }

  marcarTodasLeidas() {
    this.alertas.forEach(a => a.leida = true);
  }

  eliminarAlerta(id: string) {
    this.alertas = this.alertas.filter(a => a.id !== id);
    if (this.alertaSeleccionada?.id === id) this.cerrarModal();
  }

  getIconPath(icono: string): string {
    const icons: { [key: string]: string } = {
      ac: 'M3 8h18v8H3zM7 12h2M15 12h2',
      washer: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 14a4 4 0 100-8 4 4 0 000 8z',
      routine: 'M12 2v10l4 4M12 22a10 10 0 100-20 10 10 0 000 20z',
      solar: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      lightning: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      thermostat: 'M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z',
      leaf: 'M17 8C8 10 5.9 16.17 3.82 19c0 0 6-4 11.5-3.5C15.71 15.55 18 13 18 10a6 6 0 00-1-2z'
    };
    return icons[icono] || 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
  }

  constructor(private router: Router) {}

  logout() {
    this.router.navigate(['/login']);
  }
}
