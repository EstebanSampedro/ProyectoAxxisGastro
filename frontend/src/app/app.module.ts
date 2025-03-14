import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser'; 
import { AppRoutingModule } from './app-routing.module'; // Módulo de rutas
import { HttpClientModule } from '@angular/common/http'; // <-- Agrega esta importación
import { AppComponent } from './app.component';
import { RegistroCitasComponent } from './components/citas/registro-citas.component';
import { ConsultasComponent } from './components/consultas/consultas.component';
import { ConsultasMenuDocComponent } from './components/consultas-menu-doc/consultas-menu-doc.component';
import { LoginComponent } from './components/login/login.component';
import { MainHeaderComponent } from './components/main-header/main-header.component';
import { MenuComponent } from './components/menu/menu.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
const routes: Routes = [
  // Define tus rutas aquí
];

@NgModule({
  declarations: [
    AppComponent,
    RegistroCitasComponent,
    ConsultasComponent,
    ConsultasMenuDocComponent,
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
    FormsModule,
    FontAwesomeModule
  ],
  providers: [], // No es necesario incluir AppComponent aquí
  bootstrap: [AppComponent]
})
export class AppModule { }
