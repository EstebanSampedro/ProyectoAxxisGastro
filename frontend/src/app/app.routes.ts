import { Routes } from '@angular/router';

export const routes: Routes = [
  // Aquí defines tus rutas, por ejemplo:
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'menu', loadComponent: () => import('./components/menu/menu.component').then(m => m.MenuComponent) }
];
