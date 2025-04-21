import { Component, OnInit } from '@angular/core';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ObservacionService } from '../../services/observaciones.generales.service';
import { Observacion } from '../../interfaces/observacion.general';

@Component({
  selector: 'app-observaciones',
  templateUrl: './observaciones.component.html',
  styleUrls: ['./observaciones.component.css'],
  standalone: false
})
export class ObservacionesComponent implements OnInit {
  observaciones: Observacion[] = [];
  selectedDate: Date = new Date();

  constructor(private observacionService: ObservacionService) {}

  ngOnInit(): void {
    // Al iniciar, cargamos las obs. de hoy
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
    const fechaParam = format(this.selectedDate, 'yyyy-MM-dd');
    this.observacionService
      .filterObservacionesByDate(fechaParam)
      .subscribe({
        next: data => {
          this.observaciones = data;
        },
        error: err => console.error('Error al cargar observaciones:', err)
      });
  }
}
