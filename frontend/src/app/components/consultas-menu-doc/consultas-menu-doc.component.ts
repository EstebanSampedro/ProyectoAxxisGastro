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

  // Para controlar el modo de edición:
  // Si editingCitaId es null, estamos en modo creación; si tiene valor, en modo edición.
  editingSlot: string | null = null;
  editingCitaId: number | null = null;

  // Objeto que guarda los datos del formulario inline (para nuevo registro o edición)
  newCitaData: any = {};

  // Mapeo de códigos de color a nombres legibles (opcional para mostrar el nombre del color)
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

  generarTimeSlots(): void {
    const startHour = 7;
    const endHour = 20;
    for (let hour = startHour; hour < endHour; hour++) {
      const slot1 = `${hour.toString().padStart(2, '0')}:00:00`;
      this.timeSlots.push(slot1);
      const slot2 = `${hour.toString().padStart(2, '0')}:30:00`;
      this.timeSlots.push(slot2);
    }
  }

  onDateChange(): void {
    const parsedDate = parseISO(this.selectedDate);
    this.formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
    this.cargarConsultas();
    this.cargarObservaciones();
  }

  cargarNombreDoctor(): void {
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

  cargarConsultas(): void {
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

  cargarObservaciones(): void {
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

  guardarObservaciones(): void {
    const url = `http://localhost:3000/api/citas/observaciones`;
    const body = {
      doctorId: this.idDoctor,
      fecha: this.selectedDate,
      observaciones: this.observaciones
    };
    this.http.post(url, body).subscribe({
      next: (resp) => {
        console.log('Observaciones guardadas:', resp);
        this.cargarObservaciones();
      },
      error: (err) => {
        console.error('Error al guardar observaciones:', err);
      }
    });
  }

  getCitaBySlot(slot: string): any {
    return this.consultas.find(c => c.horaStr === slot);
  }

  // Modo creación de nueva cita
  iniciarCita(slot: string): void {
    this.editingSlot = slot;
    this.editingCitaId = null;
    this.newCitaData = {
      paciente: '',
      telefono: '',
      seguro: '',
      observaciones: '',
      colorCita: '#FFFFFF'
    };
  }

  // Modo edición: al presionar el botón de editar (lápiz)
  editarConsulta(cita: any): void {
    this.editingCitaId = cita.idCita;
    this.editingSlot = cita.horaStr;
    // Se carga la información existente en el formulario inline; se añade la propiedad "modificado" para marcar la edición
    this.newCitaData = { ...cita, hora: cita.horaStr, horaTermina: cita.horaFinStr, modificado: true };
  }

  // Guarda la nueva cita (creación)
  guardarCita(slot: string): void {
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
      procedimiento: this.newCitaData.procedimiento || '',
      imagen: this.newCitaData.imagen || '',
      pedido: this.newCitaData.pedido || '',
      institucion: this.newCitaData.institucion || '',
      seguro: this.newCitaData.seguro || '',
      estado: 'activo',
      confirmado: 'pendiente',
      observaciones: this.newCitaData.observaciones || '',
      observaciones2: '',
      colorCita: this.newCitaData.colorCita || '#FFFFFF',
      modificado: false
    };

    this.http.post('http://localhost:3000/api/citas/register', body).subscribe({
      next: (resp: any) => {
        console.log('Cita agregada:', resp);
        this.editingSlot = null;
        this.newCitaData = {};
        this.cargarConsultas();
      },
      error: (err) => {
        console.error('Error al agregar cita:', err);
      }
    });
  }

  // Guarda la edición de una cita existente (PUT)
  guardarEdicion(): void {
    const url = `http://localhost:3000/api/citas/${this.newCitaData.idCita}`;
    const body = {
      idDoctor_cita: parseInt(this.idDoctor),
      fecha: this.selectedDate,
      torre: 1,
      hora: this.newCitaData.hora,
      horaTermina: this.newCitaData.horaTermina,
      paciente: this.newCitaData.paciente || 'Paciente X',
      edad: this.newCitaData.edad || 30,
      telefono: this.newCitaData.telefono || '',
      procedimiento: this.newCitaData.procedimiento || '',
      imagen: this.newCitaData.imagen || '',
      pedido: this.newCitaData.pedido || '',
      institucion: this.newCitaData.institucion || '',
      seguro: this.newCitaData.seguro || '',
      estado: this.newCitaData.estado || 'activo',
      confirmado: this.newCitaData.confirmado || 'pendiente',
      observaciones: this.newCitaData.observaciones || '',
      observaciones2: this.newCitaData.observaciones2 || '',
      colorCita: this.newCitaData.colorCita || '#FFFFFF',
      modificado: true
    };

    this.http.put(url, body).subscribe({
      next: (resp: any) => {
        console.log('Cita editada:', resp);
        this.editingCitaId = null;
        this.newCitaData = {};
        this.cargarConsultas();
      },
      error: (err) => {
        console.error('Error al editar cita:', err);
      }
    });
  }

  cancelarEdicion(): void {
    this.editingCitaId = null;
    this.newCitaData = {};
  }

  cancelarCita(): void {
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

  confirmarCita(cita: any): void {
    console.log('Confirmar cita:', cita);
    // Implementa la lógica para confirmar la cita, por ejemplo haciendo un PATCH o PUT a otro endpoint
  }

  eliminarConsulta(cita: any): void {
    if (!cita || !cita.idCita) return;
    const url = `http://localhost:3000/api/citas/${cita.idCita}`;
    this.http.delete(url).subscribe({
      next: (resp) => {
        console.log('Cita eliminada:', resp);
        this.cargarConsultas();
      },
      error: (err) => {
        console.error('Error al eliminar cita:', err);
      }
    });
  }

  // Métodos de navegación del menú
  goToInicio(): void {
    window.location.href = 'http://tuservidor/axxis-citas/paginas/principal';
  }
  goToHistorialCitas(): void {
    this.router.navigate(['/historial-citas']);
  }
  goToModificaciones(): void {
    this.router.navigate(['/historial-modificaciones']);
  }
  goToConfirmaciones(): void {
    this.router.navigate(['/historial-confirmaciones']);
  }
  goToUsuarios(): void {
    this.router.navigate(['/config-usuarios']);
  }
  goToDoctores(): void {
    this.router.navigate(['/config-doctores']);
  }
  goToTorres(): void {
    this.router.navigate(['/config-torres']);
  }
  goToSalir(): void {
    this.router.navigate(['/menu']);
  }
}
