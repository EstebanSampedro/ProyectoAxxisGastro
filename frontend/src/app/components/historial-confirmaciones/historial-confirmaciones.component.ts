// src/app/components/historial-confirmaciones/historial-confirmaciones.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-historial-confirmaciones',
  templateUrl: './historial-confirmaciones.component.html',
  styleUrls: ['./historial-confirmaciones.component.css'],
  standalone: false
})
export class HistorialConfirmacionesComponent implements OnInit {
  fromDate: string = '';
  toDate:   string = '';
  selectedDoctor: string = '';
  doctores: any[] = [];
  confirmaciones: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.fromDate = this.toDate = hoy.toISOString().substring(0, 10);
    this.cargarDoctores();
  }

  private cargarDoctores(): void {
    this.http.get<any[]>('http://192.168.9.8:3000/api/doctores')
      .subscribe({
        next: data => this.doctores = data.map(d => ({
          doctorId: d.idDoctor2,
          doctor:   d.nomDoctor2
        })),
        error: err => console.error('Error cargando doctores:', err)
      });
  }

  buscar(): void {
    // construye los params tal y como los espera el backend
    let params = new HttpParams()
      .set('from', this.fromDate)
      .set('to',   this.toDate);

    if (this.selectedDoctor) {
      params = params.set('doctorId', this.selectedDoctor);
    }

    this.http.get<any[]>('http://192.168.9.8:3000/api/historial/confirmaciones', { params })
      .subscribe({
        next: data => this.confirmaciones = data,
        error: err => console.error('Error al buscar confirmaciones:', err)
      });
  }

  /**
   * Formatea un string "YYYY-MM-DD" como fecha en español,
   * creando primero un Date a las 12:00 para neutralizar offsets.
   */
  formatearFecha(textoISO: string): string {
    if (!textoISO) return '';
    // «textoISO» viene como "2025-04-18". Le añadimos hora “T12:00:00”
    const fecha = new Date(`${textoISO}T12:00:00`);
    return format(fecha, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
  }
}
