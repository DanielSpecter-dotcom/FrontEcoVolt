import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion {
  guardadoExitoso = false;

  // Hogar Virtual
  hogar = {
    nombrePropiedad: 'Casa San Isidro',
    ubicacion: 'Lima, Perú',
    tipoPropiedad: 'CASA',
    metrosCuadrados: 120,
  };

  // Preferencias de Energía
  energia = {
    moneda: 'SOLES',
    unidad: 'KWH',
    limiteConsumodiario: 15,
    limiteConsumomensual: 350,
    presupuestomensual: 180,
  };

  // Apariencia
  apariencia = {
    tema: 'CLARO',
    idioma: 'ES',
    zonaHoraria: 'America/Lima',
  };

  // Notificaciones
  notificaciones = {
    consumoCritico: true,
    reporteMensual: true,
    mantenimiento: false,
    alertasSeguridad: true,
    recordatoriosRutina: false,
  };

  // Integración
  integracion = {
    googleHome: false,
    alexa: false,
    smartThings: false,
  };

  // Tarifas de Energía
  tarifa = {
    tipoTarifa: 'FLEXIBLE', // 'FLEXIBLE' o 'FIJA'
    costoKwhBase: 0.48, // costo base en moneda local
    costoKwhPico: 0.75, // costo en hora punta
    horaPuntaInicio: '18:00',
    horaPuntaFin: '23:00',
  };

  // Asistente Eco-IA
  ecoIA = {
    sugerenciasActivas: true,
    frecuenciaConsejos: 'DIARIO', // 'DIARIO', 'SEMANAL', 'MINIMO'
    autoApagadoEco: true,
    umbralAhorroObjetivo: 15, // meta de ahorro en %
  };

  tiposPropiedades = ['CASA', 'APARTAMENTO', 'OFICINA', 'LOCAL'];
  zonaHorariaOpciones = ['America/Lima', 'America/Bogota', 'America/Santiago', 'America/Buenos_Aires', 'America/Mexico_City'];
  idiomaOpciones = [
    { code: 'ES', label: 'Español' },
    { code: 'EN', label: 'English' },
    { code: 'PT', label: 'Português' },
  ];

  get limiteDiarioTexto(): string {
    return `${this.energia.limiteConsumodiario} kWh`;
  }

  get presupuestoTexto(): string {
    return this.energia.moneda === 'SOLES'
      ? `S/. ${this.energia.presupuestomensual}`
      : `$ ${this.energia.presupuestomensual}`;
  }

  setMoneda(m: string) { this.energia.moneda = m; }
  setUnidad(u: string) { this.energia.unidad = u; }
  setTema(t: string) { this.apariencia.tema = t; }
  setTipoTarifa(t: string) { this.tarifa.tipoTarifa = t; }
  setFrecuenciaConsejos(f: string) { this.ecoIA.frecuenciaConsejos = f; }

  guardarCambios() {
    this.guardadoExitoso = true;
    setTimeout(() => (this.guardadoExitoso = false), 3000);
  }

  cancelar() {
    // reset a los valores originales (simplificado)
    this.guardadoExitoso = false;
  }

  constructor(private router: Router) {}

  logout() {
    this.router.navigate(['/login']);
  }
}
