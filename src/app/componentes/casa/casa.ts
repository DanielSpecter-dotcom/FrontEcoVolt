import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StateService } from '../../servicios/state.service';
import { ApiService } from '../../servicios/api.service';
import { AuthService } from '../../servicios/auth.service';
import { CasaDTO, HabitacionDTO } from '../../modelos';

@Component({
  selector: 'app-casa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './casa.html',
  styleUrl: './casa.css',
})
export class Casa implements OnInit {
  isCreatingHome = false;
  newCasaNombre = '';

  constructor(
    private router: Router,
    public stateService: StateService,
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    if (this.stateService.isBackendConnected) {
      // Ya hay datos cargados (navegación interna), no hace falta recargar
      return;
    }
    this.stateService.loadFromBackend();
  }



  // ==================== Casas ====================

  get casas(): CasaDTO[] {
    if (!this.stateService.searchQuery.trim()) {
      return this.stateService.casas;
    }
    const term = this.stateService.searchQuery.toLowerCase();
    return this.stateService.casas.filter(c => c.nombre.toLowerCase().includes(term));
  }

  get selectedCasaId(): number | null {
    return this.stateService.selectedCasaId;
  }

  /** Número de casas registradas (stat superior) */
  get totalCasas(): number {
    return this.casas.length;
  }

  /** Límite de casas permitido según el plan: ilimitado en Empresarial, 1 en Personal. */
  get limiteCasasTexto(): string {
    return this.stateService.esEmpresarial ? 'Ilimitado' : '1';
  }

  /**
   * Habitaciones de la CASA SELECCIONADA únicamente.
   * (El backend no nos da habitaciones de todas las casas a la vez,
   * solo se cargan completas las de la casa activa).
   */
  get habitacionesCasaSeleccionada(): HabitacionDTO[] {
    return this.stateService.habitacionesDeCasaSeleccionada;
  }

  /** Dispositivos de la casa seleccionada */
  get dispositivosCasaSeleccionada() {
    return this.stateService.dispositivosDeCasaSeleccionada;
  }

  /** Consumo de hoy (kWh) de la casa seleccionada */
  get consumoHoyCasaSeleccionada(): number {
    if (!this.selectedCasaId) return 0;
    return parseFloat(this.stateService.consumoKwhDeCasa(this.selectedCasaId).toFixed(1));
  }

  /**
   * Devuelve las métricas a mostrar en la tarjeta de una casa.
   * Solo la casa SELECCIONADA muestra números reales; las demás
   * se ven "apagadas" (en gris) hasta que el usuario las selecciona.
   */
  isCasaSeleccionada(casa: CasaDTO): boolean {
    return casa.id === this.selectedCasaId;
  }

  /** Texto a mostrar en las mini-stats cuando la casa NO está seleccionada */
  textoNoSeleccionada = 'Selecciona para ver detalles';

  seleccionarCasa(casa: CasaDTO) {
    this.stateService.setActiveHome(casa.id);
  }

  createHome() {
    if (!this.stateService.esEmpresarial && this.stateService.casas.length >= 1) {
      this.stateService.showToast('ADVERTENCIA', 'Límite de plan', 'Tu plan Personal permite gestionar 1 sola casa. Debes actualizar tu plan para agregar un nuevo hogar.');
      this.router.navigate(['/perfil']);
      return;
    }

    const nombre = this.newCasaNombre.trim();
    if (!nombre) {
      this.stateService.showToast('ADVERTENCIA', 'Campo requerido', 'Ingresa un nombre para la casa.');
      return;
    }

    const userId = this.stateService.userId || this.authService.getUserId();
    if (!userId && this.stateService.isBackendConnected) {
      this.stateService.showToast('CRITICA', 'Error de sesión', 'No se pudo identificar el usuario actual.');
      return;
    }

    this.isCreatingHome = true;
    if (this.stateService.isBackendConnected && userId) {
      this.apiService.createHome({ nombre, usuario_id: userId }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.stateService.casas.push(res.data);
            this.stateService.setActiveHome(res.data.id);
            this.stateService.hogar.nombrePropiedad = res.data.nombre;
            this.newCasaNombre = '';
          }
          this.isCreatingHome = false;
        },
        error: (err) => {
          this.isCreatingHome = false;
          this.stateService.showToast('CRITICA', 'Error', err.error?.message || 'No se pudo crear la casa.');
        },
      });
      return;
    }

    const localCasa: CasaDTO = { id: Date.now(), nombre, usuario_id: userId || 0 };
    this.stateService.casas.push(localCasa);
    this.stateService.setActiveHome(localCasa.id);
    this.newCasaNombre = '';
    this.isCreatingHome = false;
  }

}
