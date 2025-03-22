import { Component, OnInit } from '@angular/core';
import { ObservacionService } from '../../services/observaciones.generales.service';
import { Observacion } from '../../interfaces/observacion.general';
import { obtenerIdDoctorDesdeSessionStorage } from '../../shared/common';

@Component({
  selector: 'app-observaciones',
  templateUrl: './observaciones.component.html',
  styleUrl: './observaciones.component.css',
  standalone:false
})
export class ObservacionesComponent implements OnInit {
  constructor(private observacionService:ObservacionService){
    
  }
  idDoctor:number=0;
  observaciones: Observacion []= [];
  selectedDate:Date = new Date();

 ngOnInit(): void {
    // Obtener el idDoctor desde sessionStorage
    this.obtenerIdDoctor();
    // Recuperar la fecha desde sessionStorage
    this.recuperarFecha();
    // Cargar las observaciones
    this.cargarObservaciones();
  }

  /**
   * Obtener el idDoctor desde sessionStorage
   */
  obtenerIdDoctor(): void {
    this.idDoctor= obtenerIdDoctorDesdeSessionStorage();
  }

  /**
   * Recuperar la fecha desde sessionStorage
   */
  recuperarFecha(): void {
    const fechaString = sessionStorage.getItem('selectedDate');
    if (fechaString) {
      // Convertir la cadena yyyy-mm-dd a un objeto Date
      const [year, month, day] = fechaString.split('-');
      this.selectedDate = new Date(+year, +month - 1, +day); // Los meses en Date son base 0
      console.log('Fecha recuperada:', this.selectedDate);
    } else {
      console.error('No se encontró la fecha en sessionStorage.');
    }
  }

  /**
   * Cargar las observaciones desde el servicio
   */
  cargarObservaciones(): void {
    if (this.idDoctor) {
      this.observacionService.filterObservaciones(this.idDoctor, this.selectedDate).subscribe({
        next: (data: Observacion[]) => {
          console.log('Observaciones recibidas:', data);
          this.observaciones = data; // Asigna directamente el arreglo de observaciones
        },
        error: (err) => {
          console.error('Error al cargar observaciones:', err);
        }
      });
    } else {
      console.error('No se pudo obtener el idDoctor.');
    }
  }

  /**
   * Formatear fecha a yyyy-mm-dd
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Añade un 0 al principio si es necesario
    const day = ('0' + date.getDate()).slice(-2); // Añade un 0 al principio si es necesario
    return `${year}-${month}-${day}`;
  }
}
