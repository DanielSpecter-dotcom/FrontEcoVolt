import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

interface Dispositivo {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: string;
  carga: string; // e.g. "60W"
  estado: boolean; // true = ACTIVO, false = INACTIVO
  consumoHoy: number; // in kWh
  modo: 'AUTO' | 'MANUAL';
  showMenu?: boolean;
}

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dispositivos.html',
  styleUrl: './dispositivos.css',
})
export class Dispositivos {
  searchTerm = '';
  showAddModal = false;

  // New device form fields
  newNombre = '';
  newTipo = 'Luz';
  newUbicacion = '';
  newCarga = '';
  newModo: 'AUTO' | 'MANUAL' = 'AUTO';

  // Available types for dropdown
  tiposDisponibles = ['Luz', 'TV', 'Refrigerador', 'AC', 'Lavadora', 'Cafetera', 'Otro'];

  devices: Dispositivo[] = [
    { id: '1', nombre: 'Lámpara sala', tipo: 'Luz', ubicacion: 'Sala', carga: '60W', estado: true, consumoHoy: 0.3, modo: 'AUTO' },
    { id: '2', nombre: 'Smart TV', tipo: 'TV', ubicacion: 'Sala', carga: '120W', estado: true, consumoHoy: 0.8, modo: 'MANUAL' },
    { id: '3', nombre: 'Refrigerador', tipo: 'Refrigerador', ubicacion: 'Cocina', carga: '200W', estado: true, consumoHoy: 2.1, modo: 'AUTO' },
    { id: '4', nombre: 'Aire Acond.', tipo: 'AC', ubicacion: 'Dormitorio', carga: '1500W', estado: false, consumoHoy: 0, modo: 'AUTO' },
    { id: '5', nombre: 'Lavadora', tipo: 'Lavadora', ubicacion: 'Lavandería', carga: '800W', estado: false, consumoHoy: 0, modo: 'MANUAL' }
  ];

  // Store original active consumptions to restore when turned ON
  private defaultConsumptions: { [key: string]: number } = {
    '1': 0.3,
    '2': 0.8,
    '3': 2.1,
    '4': 3.5, // 1.5kW AC consumption when ON
    '5': 1.8  // 800W washer consumption when ON
  };

  constructor(private router: Router) {}

  // Filter devices list based on search term
  get filteredDevices() {
    if (!this.searchTerm.trim()) {
      return this.devices;
    }
    const term = this.searchTerm.toLowerCase();
    return this.devices.filter(d => 
      d.nombre.toLowerCase().includes(term) ||
      d.tipo.toLowerCase().includes(term) ||
      d.ubicacion.toLowerCase().includes(term)
    );
  }

  // Get total consumption of all active devices
  get totalConsumption(): number {
    const total = this.devices.reduce((acc, curr) => acc + curr.consumoHoy, 0);
    return parseFloat(total.toFixed(1));
  }

  // Get peak load in kW (dynamic: sum of power ratings of active devices)
  get peakLoad(): number {
    let wattsSum = 0;
    this.devices.forEach(d => {
      if (d.estado) {
        const value = parseInt(d.carga.replace(/\D/g, '')) || 0;
        wattsSum += value;
      }
    });
    // Return at least 1.5 kW to match mockup when active, or 0 if none
    if (wattsSum === 0) return 0;
    return Math.max(1.5, parseFloat((wattsSum / 1000).toFixed(1)));
  }

  // Toggle state between active and inactive
  toggleState(device: Dispositivo, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    device.estado = !device.estado;
    if (device.estado) {
      const def = this.defaultConsumptions[device.id] || 0.5;
      device.consumoHoy = def;
    } else {
      device.consumoHoy = 0;
    }
    device.showMenu = false;
  }

  // Toggle mode between AUTO and MANUAL
  toggleModo(device: Dispositivo, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    device.modo = device.modo === 'AUTO' ? 'MANUAL' : 'AUTO';
    device.showMenu = false;
  }

  // Delete a device from the list
  deleteDevice(device: Dispositivo, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.devices = this.devices.filter(d => d.id !== device.id);
  }

  // Show action menu for a specific device
  toggleMenu(device: Dispositivo, event: Event) {
    event.stopPropagation();
    const currentState = device.showMenu;
    // Close all menus first
    this.devices.forEach(d => d.showMenu = false);
    // Set this one
    device.showMenu = !currentState;
  }

  // Close menus when clicking outside
  closeAllMenus() {
    this.devices.forEach(d => d.showMenu = false);
  }

  // Open Add Device Modal
  openModal() {
    this.showAddModal = true;
    this.newNombre = '';
    this.newTipo = 'Luz';
    this.newUbicacion = '';
    this.newCarga = '';
    this.newModo = 'AUTO';
  }

  // Close Add Device Modal
  closeModal() {
    this.showAddModal = false;
  }

  // Handle adding device
  addDevice() {
    if (!this.newNombre.trim() || !this.newUbicacion.trim() || !this.newCarga.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Format power input (add 'W' if not present)
    let powerStr = this.newCarga.trim().toUpperCase();
    if (!powerStr.endsWith('W') && !powerStr.endsWith('KW')) {
      powerStr += 'W';
    }

    const newId = (this.devices.length + 1).toString();
    const watts = parseInt(powerStr.replace(/\D/g, '')) || 100;
    
    // Estimate daily consumption based on power rating (watts * rough active hours)
    const estimatedKwh = parseFloat(((watts * 4) / 1000).toFixed(1)); // assuming 4 hours use
    this.defaultConsumptions[newId] = estimatedKwh;

    const newDev: Dispositivo = {
      id: newId,
      nombre: this.newNombre,
      tipo: this.newTipo,
      ubicacion: this.newUbicacion,
      carga: powerStr,
      estado: true,
      consumoHoy: estimatedKwh,
      modo: this.newModo,
      showMenu: false
    };

    this.devices.push(newDev);
    this.closeModal();
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
