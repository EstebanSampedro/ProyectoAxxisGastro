import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router'; // Importa RouterModule y NgModule
import { LoginComponent } from './components/login/login.component';
import { MenuComponent } from './components/menu/menu.component';
import { RegistroCitasComponent } from './components/citas/registro-citas.component';
import { ConsultasComponent } from './components/consultas/consultas.component';
import { ConsultasMenuDocComponent } from './components/consultas-menu-doc/consultas-menu-doc.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'registro-citas', component: RegistroCitasComponent },
  { path: 'consultas', component: ConsultasComponent },
  { path: 'consultas-menu-doc/:idDoctor', component: ConsultasMenuDocComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], 
  exports: [RouterModule] 
})
export class AppRoutingModule { } 