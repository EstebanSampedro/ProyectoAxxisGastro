import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module'; // Importa el módulo de rutas
import { AppComponent } from './app.component';
import { RegistroCitasComponent } from './components/citas/registro-citas.component';
import { ConsultasComponent } from './components/consultas/consultas.component';
import { ConsultasMenuDocComponent } from './components/consultas-menu-doc/consultas-menu-doc.component';
import { LoginComponent } from './components/login/login.component';
import { MainHeaderComponent } from './components/main-header/main-header.component';
import { MenuComponent } from './components/menu/menu.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';


const routes: Routes = [

];

@NgModule({
  declarations: [
    RegistroCitasComponent,
    ConsultasComponent,
    ConsultasMenuDocComponent,
    LoginComponent,
    MainHeaderComponent,
    MenuComponent,
    NavBarComponent
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    RouterModule.forRoot(routes),
    FormsModule
  ],
  providers: [AppComponent],
  exports: [RouterModule]
})
export class AppModule { }

