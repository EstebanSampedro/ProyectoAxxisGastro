import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router'; // Importa RouterModule y NgModule
import { LoginComponent } from './components/login/login.component';
import { MenuComponent } from './components/menu/menu.component';
import { RegistroCitasComponent } from './components/citas/registro-citas.component';
import { ConsultasComponent } from './components/consultas/consultas.component';
import { ConsultasMenuDocComponent } from './components/consultas-menu-doc/consultas-menu-doc.component';
import { ConfigUsuariosComponent } from './components/config-usuarios/config-usuarios.component';
import { ConfigDoctorComponent } from './components/config-doctor/config-doctor.component';
import { ConfigTorreComponent } from './components/config-torres/config-torres.component';
import { RespaldoExcelComponent } from './components/respaldo-excel/respaldo-excel.component';
import { ObservacionesComponent } from './components/observaciones/observaciones.component';
import { UserdocMenuComponent } from './components/userdoc-menu/userdoc-menu.component';


ConfigDoctorComponent

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'registro-citas', component: RegistroCitasComponent },
  { path: 'consultas', component: ConsultasComponent },
  { path: 'consultas-menu-doc/:idDoctor', component: ConsultasMenuDocComponent },
  { path: 'configuraciones/doctores', component: ConfigDoctorComponent },
  { path: 'configuraciones/usuarios', component: ConfigUsuariosComponent },
  { path: 'configuraciones/torres', component: ConfigTorreComponent },
  { path: 'respaldo-excel', component: RespaldoExcelComponent },
  { path: 'observaciones', component: ObservacionesComponent},
  { path: 'userdoc-menu', component: UserdocMenuComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)], 
  exports: [RouterModule] 
})
export class AppRoutingModule { } 