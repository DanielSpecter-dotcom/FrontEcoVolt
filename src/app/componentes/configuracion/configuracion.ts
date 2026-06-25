import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion implements OnInit {
  guardadoExitoso = false;

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.stateService.isBackendConnected) {
      this.loadConfigData();
    } else {
      this.stateService.loadFromBackend().then((success) => {
        if (success) this.loadConfigData();
      });
    }
  }

  private loadConfigData() {
    // Load homes
    this.apiService.getHomes().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stateService.casas = res.data;
          if (res.data.length > 0) {
            this.hogar.nombrePropiedad = res.data[0].nombre;
          }
          this.stateService.saveStateToStorage();
        }
      },
      error: () => {}
    });

    // Load rooms
    this.apiService.getRooms().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stateService.habitaciones = res.data;
          this.stateService.saveStateToStorage();
        }
      },
      error: () => {}
    });
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
    this.stateService.saveStateToStorage();

    // Sync notification settings with backend
    if (this.stateService.userId && this.stateService.isBackendConnected) {
      this.apiService.updateNotificationSettings(this.stateService.userId, {
        consumo_excesivo: this.notificaciones.consumoCritico,
        uso_prolongado: this.notificaciones.mantenimiento,
        reporte_semanal: this.notificaciones.reporteMensual,
      }).subscribe({
        next: () => {},
        error: () => {}
      });

      // Update home name if changed
      if (this.stateService.casas.length > 0) {
        const casa = this.stateService.casas[0];
        this.apiService.updateHome(casa.id, {
          nombre: this.hogar.nombrePropiedad,
          usuario_id: this.stateService.userId!
        }).subscribe({
          next: () => {},
          error: () => {}
        });
      }
    }

    this.guardadoExitoso = true;
    setTimeout(() => (this.guardadoExitoso = false), 3000);
  }

  cancelar() {
    this.guardadoExitoso = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
