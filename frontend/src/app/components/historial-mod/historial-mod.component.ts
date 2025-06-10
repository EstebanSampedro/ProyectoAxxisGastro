// src/app/components/historial-mod/historial-mod.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-historial-mod',
  templateUrl: './historial-mod.component.html',
  styleUrls: ['./historial-mod.component.css'],
  standalone: false
})
export class HistorialModComponent implements OnInit {
  fromDate: string = '';
  toDate:   string = '';
  selectedDoctor: string = '';
  doctores: any[] = [];
  logs: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.fromDate = this.toDate = hoy.toISOString().split('T')[0];
    this.cargarDoctores();
  }

  cargarDoctores(): void {
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
    let params = new HttpParams()
      .set('from', this.fromDate)
      .set('to',   this.toDate);
    if (this.selectedDoctor) {
      params = params.set('doctorId', this.selectedDoctor);
    }

    this.http.get<any[]>('http://192.168.9.8:3000/api/historial/modificaciones', { params })
      .subscribe({
        next: data => this.logs = data,
        error: err => console.error('Error al buscar historial de modificaciones:', err)
      });
  }

  formatearFechaHora(fechaISO: string): string {
    if (!fechaISO) return '';
    const d = new Date(fechaISO);
    return format(d, "yyyy-MM-dd HH:mm:ss", { locale: es });
  }
}
