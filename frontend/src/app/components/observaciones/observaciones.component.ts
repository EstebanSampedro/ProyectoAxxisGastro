import { Component, OnInit } from '@angular/core';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ObservacionService } from '../../services/observaciones.generales.service';
import { Observacion } from '../../interfaces/observacion.general';

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
   * Invocado cuando el usuario cambia la fecha en el datepicker
   */
  onDateChange(newDateStr: string): void {
    // newDateStr viene como "YYYY-MM-DD"
    this.selectedDate = parseISO(newDateStr);
    this.cargarObservaciones();
  }

  /**
   * Llama al servicio para traer las observaciones de la fecha seleccionada
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
