import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser'; 
import { AppRoutingModule } from './app-routing.module'; // Módulo de rutas
import { HttpClientModule } from '@angular/common/http'; // <-- Agrega esta importación
import { AppComponent } from './app.component';
import { RegistroCitasComponent } from './components/citas/registro-citas.component';
import { ConsultasComponent } from './components/consultas/consultas.component';
import { ConsultasMenuDocComponent } from './components/consultas-menu-doc/consultas-menu-doc.component';
import { ConfigUsuariosComponent } from './components/config-usuarios/config-usuarios.component';
import { ConfigDoctorComponent } from './components/config-doctor/config-doctor.component';
import { ConfigTorreComponent } from './components/config-torres/config-torres.component';
import { LoginComponent } from './components/login/login.component';
import { MainHeaderComponent } from './components/main-header/main-header.component';
import { MenuComponent } from './components/menu/menu.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DatePickerComponent } from './components/date-picker/date-picker.component';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { RespaldoExcelComponent } from './components/respaldo-excel/respaldo-excel.component';
import { ObservacionesComponent } from './components/observaciones/observaciones.component';
const routes: Routes = [
  // Define tus rutas aquí
];

@NgModule({
  declarations: [
    AppComponent,
    RegistroCitasComponent,
    ConsultasComponent,
    ConsultasMenuDocComponent,
    ConfigUsuariosComponent,
    ConfigDoctorComponent,
    ConfigTorreComponent,
    RespaldoExcelComponent,
    LoginComponent,
    MainHeaderComponent,
    MenuComponent,
    NavBarComponent,
    DatePickerComponent,
    ObservacionesComponent
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
export class AppModule { 
  constructor(
    
  ){
    library.add(faChevronLeft, faChevronRight)
  }
}
