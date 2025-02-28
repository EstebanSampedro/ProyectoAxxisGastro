import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para [(ngModel)]
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-consultas-menu-doc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultas-menu-doc.component.html',
  styleUrls: ['./consultas-menu-doc.component.css']
})
export class ConsultasMenuDocComponent implements OnInit {
  idDoctor!: string;
  doctorName: string = '';
  selectedDate: string = '';
  formattedDate: string = '';
  observaciones: string = '';
  consultas: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Leer el id del doctor de la URL
    this.idDoctor = this.route.snapshot.paramMap.get('idDoctor') || '';
    // Inicializar la fecha actual
    const hoy = new Date();
    this.selectedDate = hoy.toISOString().split('T')[0];
    this.onDateChange();
    // Cargar datos iniciales
    this.cargarNombreDoctor();
    this.cargarConsultas();
    this.cargarObservaciones();
  }

  onDateChange() {
    const parsedDate = parseISO(this.selectedDate);
    this.formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'del' yyyy", {
      locale: es
    });
    // Recargar datos al cambiar la fecha
    this.cargarConsultas();
    this.cargarObservaciones();
  }

  cargarNombreDoctor() {
    // Ejemplo: GET /api/doctor/:idDoctor
    const url = `http://localhost:3000/api/doctores/${this.idDoctor}`;
    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.doctorName = data.nomDoctor2 || 'DR. SIN NOMBRE';
      },
      error: (err) => {
        console.error('Error al obtener nombre del doctor:', err);
        this.doctorName = 'DR. SIN NOMBRE';
      }
    });
  }

  cargarConsultas() {
    // Ejemplo: GET /api/consultas?doctorId=...&fecha=...
    const url = `http://localhost:3000/api/consultas?doctorId=${this.idDoctor}&fecha=${this.selectedDate}`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.consultas = data;
        console.log('Consultas:', data);
      },
      error: (err) => {
        console.error('Error al obtener consultas:', err);
      }
    });
  }

  cargarObservaciones() {
    // Ejemplo: GET /api/consultas/observaciones?doctorId=...&fecha=...
    const url = `http://localhost:3000/api/consultas/observaciones?doctorId=${this.idDoctor}&fecha=${this.selectedDate}`;
    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.observaciones = data.observaciones || '';
      },
      error: (err) => {
        console.error('Error al obtener observaciones:', err);
      }
    });
  }

  guardarObservaciones() {
    // Ejemplo: POST /api/consultas/observaciones
    const url = `http://localhost:3000/api/consultas/observaciones`;
    const body = {
      doctorId: this.idDoctor,
      fecha: this.selectedDate,
      observaciones: this.observaciones
    };
    this.http.post(url, body).subscribe({
      next: (resp) => {
        console.log('Observaciones guardadas:', resp);
      },
      error: (err) => {
        console.error('Error al guardar observaciones:', err);
      }
    });
  }

  editarConsulta(consulta: any) {
    console.log('Editar consulta:', consulta);
    // Aquí podrías navegar a una ruta de edición o abrir un modal
  }

  eliminarConsulta(consulta: any) {
    console.log('Eliminar consulta:', consulta);
    // Aquí llamarías a un endpoint para eliminar la consulta
  }

  // Métodos de navegación del menú

  goToInicio() {
    // Si "INICIO" debe llevar a una URL externa, por ejemplo:
    window.location.href = 'http://tuservidor/axxis-citas/paginas/principal';
  }

  goToHistorialCitas() {
    this.router.navigate(['/historial-citas']);
  }

  goToModificaciones() {
    this.router.navigate(['/historial-modificaciones']);
  }

  goToConfirmaciones() {
    this.router.navigate(['/historial-confirmaciones']);
  }

  goToUsuarios() {
    this.router.navigate(['/config-usuarios']);
  }

  goToDoctores() {
    this.router.navigate(['/config-doctores']);
  }

  goToTorres() {
    this.router.navigate(['/config-torres']);
  }

  goToSalir() {
    this.router.navigate(['/menu']);
  }
}
