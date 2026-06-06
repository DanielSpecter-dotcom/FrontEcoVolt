import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService } from '../../servicios/state.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion {
  guardadoExitoso = false;

  constructor(
    private router: Router,
    public stateService: StateService
  ) {
    this.stateService.loadState();
  }

  // Getters to stateService objects for reference binding
  get hogar() {
    return this.stateService.hogar;
  }

  get energia() {
    return this.stateService.energia;
  }

  get apariencia() {
    return this.stateService.apariencia;
  }

  get notificaciones() {
    return this.stateService.notificaciones;
  }

  get integracion() {
    return this.stateService.integracion;
  }

  get tarifa() {
    return this.stateService.tarifa;
  }

  get ecoIA() {
    return this.stateService.ecoIA;
  }

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

  setMoneda(m: string) { 
    this.energia.moneda = m; 
  }
  
  setUnidad(u: string) { 
    this.energia.unidad = u; 
  }
  
  setTema(t: string) { 
    this.apariencia.tema = t; 
  }
  
  setTipoTarifa(t: string) { 
    this.tarifa.tipoTarifa = t; 
  }
  
  setFrecuenciaConsejos(f: string) { 
    this.ecoIA.frecuenciaConsejos = f; 
  }

  guardarCambios() {
    // Sync configured location back to profile city
    this.stateService.usuario.ciudad = this.hogar.ubicacion;
    this.guardadoExitoso = true;
    setTimeout(() => (this.guardadoExitoso = false), 3000);
  }

  cancelar() {
    this.guardadoExitoso = false;
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
