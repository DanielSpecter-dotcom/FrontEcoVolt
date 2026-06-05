import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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
export class Consumo {
  activeTab: 'dispositivo' | 'ambiente' | 'reporte' | 'comparativa' = 'ambiente';
  activeTimeframe: 'dia' | 'semana' | 'mes' = 'semana';

  totalMes = 142;

  ambientes: DetalleAmbiente[] = [
    { nombre: 'Sala de Estar', dispositivos: 4, costoMes: 48.20, porcentaje: 34, promedioKwh: 2.4, color: '#0d9488', icon: 'sofa' },
    { nombre: 'Cocina', dispositivos: 6, costoMes: 39.76, porcentaje: 28, promedioKwh: 1.9, color: '#16a34a', icon: 'utensils' },
    { nombre: 'Dormitorio Principal', dispositivos: 3, costoMes: 31.24, porcentaje: 22, promedioKwh: 1.4, color: '#4ade80', icon: 'bed' },
    { nombre: 'Lavandería', dispositivos: 2, costoMes: 22.80, porcentaje: 16, promedioKwh: 0.8, color: '#2dd4bf', icon: 'washer' }
  ];

  historialSemanal: DiaConsumo[] = [
    { dia: 'LUN', sala: 1.5, cocina: 1.2, dormitorio: 1.0, lavanderia: 0.8, total: 4.5 },
    { dia: 'MAR', sala: 2.2, cocina: 1.8, dormitorio: 1.4, lavanderia: 1.1, total: 6.5 },
    { dia: 'MIE', sala: 3.4, cocina: 2.8, dormitorio: 2.2, lavanderia: 1.6, total: 10.0, isHoy: true },
    { dia: 'JUE', sala: 1.8, cocina: 1.5, dormitorio: 1.2, lavanderia: 0.9, total: 5.4 },
    { dia: 'VIE', sala: 2.8, cocina: 2.2, dormitorio: 1.8, lavanderia: 1.2, total: 8.0 },
    { dia: 'SAB', sala: 3.1, cocina: 2.6, dormitorio: 2.0, lavanderia: 1.3, total: 9.0 },
    { dia: 'DOM', sala: 3.2, cocina: 2.5, dormitorio: 1.9, lavanderia: 1.4, total: 9.0 }
  ];

  constructor(private router: Router) {}

  selectTab(tab: 'dispositivo' | 'ambiente' | 'reporte' | 'comparativa') {
    this.activeTab = tab;
  }

  selectTimeframe(tf: 'dia' | 'semana' | 'mes') {
    this.activeTimeframe = tf;
  }

  exportData() {
    alert('Exportando datos de consumo en formato CSV/Excel...');
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
