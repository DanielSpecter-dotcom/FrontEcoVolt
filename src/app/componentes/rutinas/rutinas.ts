import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

interface AccionDispositivo {
  id: string;
  dispositivo: string;
  tipo: string;
  tipoAccion: 'ENCENDER' | 'APAGAR';
  icon: string;
}

interface Rutina {
  id: string;
  nombre: string;
  hora: string; // "06:30"
  periodo: 'AM' | 'PM';
  dias: string[]; // ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  activa: boolean; // Automático ON/OFF
  estado: 'ACTIVA' | 'PAUSADA';
  acciones: AccionDispositivo[];
}

@Component({
  selector: 'app-rutinas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './rutinas.html',
  styleUrl: './rutinas.css',
})
export class Rutinas {
  routines: Rutina[] = [
    {
      id: '1',
      nombre: 'Rutina Mañana',
      hora: '06:30',
      periodo: 'AM',
      dias: ['L', 'M', 'X', 'J', 'V'],
      activa: true,
      estado: 'ACTIVA',
      acciones: [
        { id: 'a1', dispositivo: 'Lámpara Sala', tipo: 'ILUMINACIÓN INTELIGENTE', tipoAccion: 'ENCENDER', icon: 'lamp' },
        { id: 'a2', dispositivo: 'Cafetera', tipo: 'ELECTRODOMÉSTICO', tipoAccion: 'ENCENDER', icon: 'coffee' },
        { id: 'a3', dispositivo: 'TV Sala', tipo: 'ENTRETENIMIENTO', tipoAccion: 'APAGAR', icon: 'tv' }
      ]
    },
    {
      id: '2',
      nombre: 'Modo Noche',
      hora: '11:00',
      periodo: 'PM',
      dias: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      activa: true,
      estado: 'ACTIVA',
      acciones: [
        { id: 'b1', dispositivo: 'Lámpara Sala', tipo: 'ILUMINACIÓN INTELIGENTE', tipoAccion: 'APAGAR', icon: 'lamp' },
        { id: 'b2', dispositivo: 'TV Sala', tipo: 'ENTRETENIMIENTO', tipoAccion: 'APAGAR', icon: 'tv' }
      ]
    },
    {
      id: '3',
      nombre: 'Fin de semana',
      hora: '09:00',
      periodo: 'AM',
      dias: ['S', 'D'],
      activa: false,
      estado: 'PAUSADA',
      acciones: [
        { id: 'c1', dispositivo: 'Cafetera', tipo: 'ELECTRODOMÉSTICO', tipoAccion: 'ENCENDER', icon: 'coffee' }
      ]
    }
  ];

  selectedRoutine!: Rutina;
  
  // Working copy for editing
  editNombre = '';
  editHora = '';
  editPeriodo: 'AM' | 'PM' = 'AM';
  editDias: string[] = [];
  editActiva = true;
  editAcciones: AccionDispositivo[] = [];

  diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  constructor(private router: Router) {
    this.selectRoutine(this.routines[0]);
  }

  selectRoutine(routine: Rutina) {
    this.selectedRoutine = routine;
    // Load working copy
    this.editNombre = routine.nombre;
    this.editHora = routine.hora;
    this.editPeriodo = routine.periodo;
    this.editDias = [...routine.dias];
    this.editActiva = routine.activa;
    this.editAcciones = JSON.parse(JSON.stringify(routine.acciones)); // deep copy
  }

  isDaySelected(day: string): boolean {
    return this.editDias.includes(day);
  }

  toggleDay(day: string) {
    if (this.editDias.includes(day)) {
      this.editDias = this.editDias.filter(d => d !== day);
    } else {
      this.editDias.push(day);
    }
  }

  togglePeriod(p: 'AM' | 'PM') {
    this.editPeriodo = p;
  }

  removeAction(actionId: string) {
    this.editAcciones = this.editAcciones.filter(a => a.id !== actionId);
  }

  addAction() {
    const devicesList = [
      { name: 'Lavadora', type: 'ELECTRODOMÉSTICO', icon: 'washer', action: 'APAGAR' as const },
      { name: 'Aire Acond.', type: 'CLIMATIZACIÓN', icon: 'ac', action: 'ENCENDER' as const },
      { name: 'Lámpara Dormitorio', type: 'ILUMINACIÓN INTELIGENTE', icon: 'lamp', action: 'ENCENDER' as const }
    ];

    const randomDev = devicesList[Math.floor(Math.random() * devicesList.length)];
    const newAction: AccionDispositivo = {
      id: 'act_' + Date.now(),
      dispositivo: randomDev.name,
      tipo: randomDev.type,
      tipoAccion: randomDev.action,
      icon: randomDev.icon
    };

    this.editAcciones.push(newAction);
  }

  toggleActionType(action: AccionDispositivo) {
    action.tipoAccion = action.tipoAccion === 'ENCENDER' ? 'APAGAR' : 'ENCENDER';
  }

  saveRoutine() {
    // Save to the main array
    this.selectedRoutine.nombre = this.editNombre;
    this.selectedRoutine.hora = this.editHora;
    this.selectedRoutine.periodo = this.editPeriodo;
    this.selectedRoutine.dias = [...this.editDias];
    this.selectedRoutine.activa = this.editActiva;
    this.selectedRoutine.estado = this.editActiva ? 'ACTIVA' : 'PAUSADA';
    this.selectedRoutine.acciones = JSON.parse(JSON.stringify(this.editAcciones));

    alert('Rutina guardada correctamente.');
  }

  discardChanges() {
    this.selectRoutine(this.selectedRoutine);
  }

  createRoutine() {
    const newId = (this.routines.length + 1).toString();
    const newRoutine: Rutina = {
      id: newId,
      nombre: 'Nueva Rutina ' + newId,
      hora: '12:00',
      periodo: 'PM',
      dias: ['L'],
      activa: true,
      estado: 'ACTIVA',
      acciones: []
    };
    this.routines.push(newRoutine);
    this.selectRoutine(newRoutine);
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
