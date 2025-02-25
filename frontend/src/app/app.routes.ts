import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'menu', loadComponent: () => import('./components/menu/menu.component').then(m => m.MenuComponent) },
  { path: 'registro-citas', loadComponent: () => import('./components/registro-citas/registro-citas.component').then((m) => m.RegistroCitasComponent)},
  // ... Agrega más rutas si lo deseas
];
