import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser'; 
import { AppRoutingModule } from './app-routing.module'; // Módulo de rutas
import { HttpClientModule } from '@angular/common/http'; // <-- Agrega esta importación
import { AppComponent } from './app.component';
import { RegistroCitasComponent } from './components/citas/registro-citas.component';
import { ConsultasComponent } from './components/consultas/consultas.component';
import { ConsultasMenuDocComponent } from './components/consultas-menu-doc/consultas-menu-doc.component';
import { ConfigDoctorComponent } from './components/config-doctor/config-doctor.component';
import { LoginComponent } from './components/login/login.component';
import { MainHeaderComponent } from './components/main-header/main-header.component';
import { MenuComponent } from './components/menu/menu.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DragDropModule } from '@angular/cdk/drag-drop';

const routes: Routes = [
  // Define tus rutas aquí
];

@NgModule({
  declarations: [
    AppComponent,
    RegistroCitasComponent,
    ConsultasComponent,
    ConsultasMenuDocComponent,
    ConfigDoctorComponent,
    LoginComponent,
    MainHeaderComponent,
    MenuComponent,
    NavBarComponent
  ],
  imports: [
    BrowserModule,  // Esencial para aplicaciones en el navegador
    HttpClientModule, // <-- Agrega HttpClientModule aquí
    AppRoutingModule,
    RouterModule.forRoot(routes),
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    DragDropModule
  ],
  providers: [], // No es necesario incluir AppComponent aquí
  bootstrap: [AppComponent]
})
export class AppModule { }
