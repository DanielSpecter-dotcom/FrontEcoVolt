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

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'verificar-codigo',
        component: VerificarCodigo
    },
    {
        path: 'registro',
        component: Registro
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'dashboard',
        component: Dashboard
    },
    {
        path: 'dispositivos',
        component: Dispositivos
    },
    {
        path: 'consumo',
        component: Consumo
    },
    {
        path: 'rutinas',
        component: Rutinas
    },
    {
        path: 'alertas',
        component: Alertas
    },
    {
        path: 'perfil',
        component: Perfil
    },
    {
        path: 'configuracion',
        component: Configuracion
    }
];