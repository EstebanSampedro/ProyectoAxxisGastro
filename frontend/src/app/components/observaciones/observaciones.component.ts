import { Component, OnInit } from '@angular/core';
import { ObservacionService } from '../../services/observaciones.generales.service';
import { Observacion } from '../../interfaces/observacion.general';
import { obtenerIdDoctorDesdeSessionStorage } from '../../shared/common';

@Component({
  selector: 'app-observaciones',
  templateUrl: './observaciones.component.html',
  styleUrl: './observaciones.component.css',
  standalone: false
})
export class ObservacionesComponent implements OnInit {
  constructor(private observacionService: ObservacionService) {

  }
  observaciones: Observacion[] = [];
  selectedDate: Date = new Date();

  ngOnInit(): void {
    // Recuperar la fecha desde sessionStorage
    this.recuperarFecha();
    // Cargar las observaciones
    this.cargarObservaciones();
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
    this.observacionService.filterObservacionesByDate(this.selectedDate).subscribe({
      next: (data: Observacion[]) => {
        console.log('Observaciones recibidas:', data);
        this.observaciones = data; // Asigna directamente el arreglo de observaciones
      },
      error: (err) => {
        console.error('Error al cargar observaciones:', err);
      }
    });
  }
}
