import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-consultas-menu-doc',
  templateUrl: './consultas-menu-doc.component.html',
  styleUrls: ['./consultas-menu-doc.component.css'],
  standalone: false
})
export class ConsultasMenuDocComponent implements OnInit {
  idDoctor!: string;
  doctorName: string = '';

  selectedDate: string = '';
  formattedDate: string = '';
  observaciones: string = '';

  // Lista de citas (transformadas con horaStr y horaFinStr)
  consultas: any[] = [];

  // Slots de 7:00 a 20:00 (cada 30 min)
  timeSlots: string[] = [];

  // Indica qué slot está en edición
  editingSlot: string | null = null;

  // Objeto que guarda los datos del formulario inline
  newCitaData: any = {};

  // Mapeo de códigos de color a nombres legibles
  colorNames: { [key: string]: string } = {
    '#FFFFFF': 'Ninguno',
    '#ffffff': 'Ninguno',
    '#ffff00': 'Amarillo',
    '#ff0000': 'Rojo',
    '#0000ff': 'Azul',
    '#FEBB02': 'Naranja',
    '#00ff00': 'Verde',
    '#8080c0': 'Gris'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.idDoctor = this.route.snapshot.paramMap.get('idDoctor') || '';
    this.generarTimeSlots();

    const hoy = new Date();
    this.selectedDate = hoy.toISOString().split('T')[0];
    this.onDateChange();

    this.cargarNombreDoctor();
    this.cargarConsultas();
    this.cargarObservaciones();
  }

  generarTimeSlots() {
    const startHour = 7;
    const endHour = 20;
    for (let hour = startHour; hour < endHour; hour++) {
      const slot1 = `${hour.toString().padStart(2, '0')}:00:00`;
      this.timeSlots.push(slot1);

      const slot2 = `${hour.toString().padStart(2, '0')}:30:00`;
      this.timeSlots.push(slot2);
    }
  }

  onDateChange() {
    const parsedDate = parseISO(this.selectedDate);
    this.formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
    this.cargarConsultas();
    this.cargarObservaciones();
  }

  cargarNombreDoctor() {
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
    const url = `http://localhost:3000/api/citas/filter?doctorId=${this.idDoctor}&fecha=${this.selectedDate}`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.consultas = data.map(cita => {
          const horaStr = this.extraerHora(cita.hora);
          const horaFinStr = this.extraerHora(cita.horaTermina);
          return { ...cita, horaStr, horaFinStr };
        });
        console.log('Consultas:', this.consultas);
      },
      error: (err) => {
        console.error('Error al obtener consultas:', err);
      }
    });
  }

  // Extrae la hora en formato "HH:mm:00" de una cadena tipo "1970-01-01T08:00:00.000Z"
  extraerHora(fechaString: string): string {
    if (!fechaString) return '';
    const match = fechaString.match(/T(\d{2}:\d{2}):/);
    return match ? `${match[1]}:00` : '';
  }

  cargarObservaciones() {
    const url = `http://localhost:3000/api/citas/observaciones?doctorId=${this.idDoctor}&fecha=${this.selectedDate}`;
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
    const url = `http://localhost:3000/api/citas/observaciones`;
    const body = {
      doctorId: this.idDoctor,
      fecha: this.selectedDate,
      observaciones: this.observaciones
    };
    this.http.post(url, body).subscribe({
      next: (resp) => {
        console.log('Observaciones guardadas:', resp);
        // Vuelve a cargar las observaciones para reflejar el cambio en el textarea
        this.cargarObservaciones();
      },
      error: (err) => {
        console.error('Error al guardar observaciones:', err);
      }
    });
  }

  getCitaBySlot(slot: string) {
    return this.consultas.find(c => c.horaStr === slot);
  }

  iniciarCita(slot: string) {
    this.editingSlot = slot;
    // Valores iniciales para los inputs
    this.newCitaData = {
      paciente: '',
      telefono: '',
      seguro: '',
      observaciones: '',
      colorCita: '#FFFFFF'
    };
  }

  guardarCita(slot: string) {
    const horaFin = this.calcularFin(slot, 30); // 30 minutos por defecto
    const body = {
      idDoctor_cita: parseInt(this.idDoctor),
      fecha: this.selectedDate,
      torre: 1,
      hora: slot,
      horaTermina: horaFin,
      paciente: this.newCitaData.paciente || 'Paciente X',
      edad: 30,
      telefono: this.newCitaData.telefono || '',
      procedimiento: '',
      imagen: '',
      pedido: '',
      institucion: '',
      seguro: this.newCitaData.seguro || '',
      estado: 'activo',
      confirmado: 'pendiente',
      observaciones: this.newCitaData.observaciones || '',
      observaciones2: '',
      colorCita: this.newCitaData.colorCita || '#FFFFFF'
    };

    this.http.post('http://localhost:3000/api/citas/register', body).subscribe({
      next: (resp: any) => {
        console.log('Cita agregada:', resp);
        this.editingSlot = null;
        this.newCitaData = {};
        this.cargarConsultas();
      },
      error: err => {
        console.error('Error al agregar cita:', err);
      }
    });
  }

  cancelarCita() {
    this.editingSlot = null;
    this.newCitaData = {};
  }

  calcularFin(slot: string, minutos: number): string {
    const [hh, mm] = slot.split(':');
    const totalMin = parseInt(mm) + minutos;
    const hour = parseInt(hh) + Math.floor(totalMin / 60);
    const min = totalMin % 60;

    const hhFin = hour.toString().padStart(2, '0');
    const mmFin = min.toString().padStart(2, '0');
    return `${hhFin}:${mmFin}:00`;
  }

  confirmarCita(cita: any) {
    console.log('Confirmar cita:', cita);
  }

  editarConsulta(cita: any) {
    console.log('Editar cita:', cita);
  }

  eliminarConsulta(cita: any) {
    console.log('Eliminar cita:', cita);
  }

  // Métodos de navegación del menú
  goToInicio() {
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
