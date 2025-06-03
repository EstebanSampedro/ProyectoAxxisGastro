import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-historial-citas',
  templateUrl: './historial-citas.component.html',
  styleUrls: ['./historial-citas.component.css'],
  standalone: false
})
export class HistorialCitasComponent implements OnInit {
  
  // Filtros:
  fromDate: string = '';
  toDate: string = '';
  selectedDoctor: string = '';   // ID del doctor
  patientName: string = '';      // Nombre del paciente (no obligatorio)
  
  // Listado de doctores (para el <select>)
  doctores: any[] = [];
  
  // Resultados al buscar
  citasHistorial: any[] = [];

  // Mensajes y estados
  notaFecha: string = 'NOTA: El rango de fecha de búsqueda es un campo obligatorio';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // Inicializa las fechas con "hoy" y "hoy"
    const hoy = new Date();
    // Por ejemplo, al inicio, fromDate y toDate podrían ser hoy
    this.fromDate = hoy.toISOString().split('T')[0];
    this.toDate   = hoy.toISOString().split('T')[0];
    
    this.cargarDoctores();
  }

  cargarDoctores(): void {
    this.http.get<any[]>('http://192.168.9.8:3000/api/doctores').subscribe({
      next: (data) => {
        // Mapear cada objeto para que tenga las propiedades "doctorId" y "doctor"
        this.doctores = data.map(doc => ({
          doctorId: doc.idDoctor2,    // Asigna el ID recibido a "doctorId"
          doctor: doc.nomDoctor2      // Asigna el nombre recibido a "doctor"
        }));
      },
      error: (err) => {
        console.error('Error al cargar doctores:', err);
      }
    });
  }
  

  buscarHistorial(): void {
    let url = `http://192.168.9.8:3000/api/historial/citas?from=${this.fromDate}&to=${this.toDate}`;
    if (this.selectedDoctor) {
      url += `&doctorId=${this.selectedDoctor}`;
    }
    if (this.patientName.trim() !== '') {
      url += `&paciente=${this.patientName.trim()}`;
    }
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.citasHistorial = data;
        console.log("Historial:", data);
      },
      error: (err) => {
        console.error("Error al buscar historial:", err);
      }
    });
  }

  // Formatear fecha a texto (opcional, para la tabla)
  formatearFecha(fechaISO: string): string {
    if (!fechaISO) return '';
    const fechaDate = new Date(fechaISO);
    return format(fechaDate, "yyyy-MM-dd", { locale: es });
  }

}
