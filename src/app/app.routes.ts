import { Routes } from '@angular/router';
import { Registro } from './componentes/registro/registro';
import { Login } from './componentes/login/login';
import { Dashboard } from './componentes/dashboard/dashboard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
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
    }
];