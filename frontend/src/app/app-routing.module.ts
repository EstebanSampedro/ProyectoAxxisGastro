import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
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
import { HistorialCitasComponent } from './components/historial-citas/historial-citas.component';
import { NotAuthorizedComponent } from './components/not-authorized/not-authorized.component'; // Componente para acceso denegado
import { HistorialModComponent } from './components/historial-mod/historial-mod.component';
import { HistorialConfirmacionesComponent } from './components/historial-confirmaciones/historial-confirmaciones.component';


import { RoleGuard } from './guards/role.guard'; // Importar la guarda de roles

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'menu',
    component: MenuComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador', 'usuario'] } // Permitir acceso a todos los roles
  },
  {
    path: 'registro-citas',
    component: RegistroCitasComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador', 'usuario'] } // Administrador y usuario
  },
  {
    path: 'consultas',
    component: ConsultasComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador', 'usuario', 'doctor'] } // Administrador y usuario
  },
  {
    path: 'consultas-menu-doc/:idDoctor',
    component: ConsultasMenuDocComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador', 'doctor', 'usuario'] } // Administrador y doctor
  },
  {
    path: 'configuraciones/doctores',
    component: ConfigDoctorComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador'] } // Solo para administrador
  },
  {
    path: 'configuraciones/usuarios',
    component: ConfigUsuariosComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador'] } // Solo para administrador
  },
  {
    path: 'configuraciones/torres',
    component: ConfigTorreComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador'] }// Solo para administrador
  },
  {
    path: 'respaldo-excel',
    component: RespaldoExcelComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador'] }// Solo para administrador
  },
  {
    path: 'observaciones',
    component: ObservacionesComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador'] } // Solo para administrador
  },
  {
    path: 'userdoc-menu',
    component: UserdocMenuComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador', 'doctor'] } // Administrador y doctor
  },
  {
    path: 'historial-citas',
    component: HistorialCitasComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador', 'usuario'] } // Administrador y usuario
  },
  {
    path: 'historial-citas-modif', component: HistorialModComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador', 'usuario'] } // Administrador y usuario
  },
  {
    path: 'historial-citas-conf', component: HistorialConfirmacionesComponent,
    canActivate: [RoleGuard],
    data: { role: ['administrador', 'usuario'] } // Administrador y usuario
  },
  {
    path: 'not-authorized',
    component: NotAuthorizedComponent
  }, // Ruta para acceso denegado
  {
    path: '**',
    redirectTo: '/not-authorized'
  }, // Ruta por defecto para no autorizados
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }