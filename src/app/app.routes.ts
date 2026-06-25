import { Routes } from '@angular/router';
import { Registro } from './componentes/registro/registro';
import { Login } from './componentes/login/login';
import { Dashboard } from './componentes/dashboard/dashboard';
import { Dispositivos } from './componentes/dispositivos/dispositivos';
import { Consumo } from './componentes/consumo/consumo';
import { Rutinas } from './componentes/rutinas/rutinas';
import { Alertas } from './componentes/alertas/alertas';
import { Perfil } from './componentes/perfil/perfil';
import { Configuracion } from './componentes/configuracion/configuracion';
import { VerificarCodigo } from './componentes/verificar-codigo/verificar-codigo';
import { authGuard } from './servicios/auth.guard';
import { Casa } from './componentes/casa/casa';
import { Habitacion } from './componentes/habitacion/habitacion';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'verificar-codigo',
    component: VerificarCodigo,
  },
  {
    path: 'registro',
    component: Registro,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },

  {
    path: 'casa',
    component: Casa,
    canActivate: [authGuard],
  },

  {
    path: 'dispositivos',
    component: Dispositivos,
    canActivate: [authGuard],
  },
  {
    path: 'consumo',
    component: Consumo,
    canActivate: [authGuard],
  },
  {
    path: 'rutinas',
    component: Rutinas,
    canActivate: [authGuard],
  },
  {
    path: 'alertas',
    component: Alertas,
    canActivate: [authGuard],
  },

  {
    path: 'habitacion',
    component: Habitacion,
    canActivate: [authGuard],
  },

  {
    path: 'perfil',
    component: Perfil,
    canActivate: [authGuard],
  },
  {
    path: 'configuracion',
    component: Configuracion,
    canActivate: [authGuard],
  },
];
