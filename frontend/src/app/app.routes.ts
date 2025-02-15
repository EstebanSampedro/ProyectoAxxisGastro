import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // Redirige cualquier ruta vacía al login:
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // También podrías capturar rutas no reconocidas:
  { path: '**', redirectTo: 'login' },
];
