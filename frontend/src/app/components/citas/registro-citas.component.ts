import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {faPrint, faMagnifyingGlass,faSave, faWarning} from '@fortawesome/free-solid-svg-icons'
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Cita } from '../../interfaces/cita';
import { CitaService } from '../../services/cita.service';
import { Observacion } from '../../interfaces/observacion.general';
import { ObservacionService } from '../../services/observaciones.generales.service';
import { formatDate, obtenerIdDoctorDesdeSessionStorage } from '../../shared/common';
import { Torre } from '../../interfaces/torre';
import { TorreService } from '../../services/torres.service';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/internal/operators/catchError';
import { ConfirmacionBody } from '../../interfaces/confirmacionBody';
import { ApiResponse } from '../../interfaces/apiResponse';
import { 
  faPhone, 
  faBell, 
  faCheck, 
  faPencil, 
  faXmark 
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-registro-citas',
  templateUrl: './registro-citas.component.html',
  styleUrls: ['./registro-citas.component.css'],
  standalone: false
})
export class RegistroCitasComponent implements OnInit {

  faPhone = faPhone;
  faBell = faBell;
  faCheck = faCheck;
  faPencil = faPencil;
  faXmark = faXmark;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private citaService : CitaService,
    private observacionService : ObservacionService,
    private torreService: TorreService

  ) {}

  selectedDate: Date = new Date();
  formattedDate: string = '';
  observaciones: string = '';
  citas: Cita[] = [];
  faPrint = faPrint;
  faSearch = faMagnifyingGlass
  faSave = faSave;
  faWarning = faWarning
  idDoctor: number = 0;
  doctorName: string = '';
  editingCitaId: number | null = null; // ID de la cita en edición
  newCitaData: Partial<Cita> = {}; // Datos temporales para nueva cita o edición
  showConfirmModal: boolean = false; // Controla la visibilidad del modal de confirmación
  citaToConfirm: any = null;


  flagObservaciones: boolean = false;
  torres: Torre[] = []; // Lista de torres
  selectedTorreId: number = 1; // ID de la torre seleccionada


  // Lista de citas (transformadas con horaStr y horaFinStr)
  consultas: any[] = [];

  // Slots de 7:00 a 20:00 (cada 30 min)
  timeSlots: string[] = [];

  // Para controlar el modo de edición
  editingSlot: string | null = null;

 
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
 

  ngOnInit(): void {
    this.idDoctor=obtenerIdDoctorDesdeSessionStorage();
    this.cargarTorres();
    this.generarTimeSlots();
    this.onDateChange();
    this.cargarCitas();
    this.cargarObservaciones();

  }

  cargarCitas(): void {
    // Convertir la fecha a string con formato YYYY-MM-DD
    const fechaStr = this.selectedDate.toISOString().split('T')[0];
    
    this.citaService.getCitasByDateAndTower(fechaStr, this.selectedTorreId)
      .subscribe({
        next: (data) => {
          this.citas = data.map(cita => {
            const horaStr = this.extraerHora(cita.hora);
            const horaFinStr = this.extraerHora(cita.horaTermina);
            return { 
              ...cita, 
              horaStr, 
              horaFinStr, 
              cedula: cita.cedula || '',
              recordatorioEnv: cita.recordatorioEnv || false
            };
          });
          console.log('Consultas:', this.citas);
        },
        error: (err) => {
          console.error('Error al obtener consultas:', err);
        }
      });
  }


  
  getCitaBySlot(slot: string): any {
    return this.citas.find(c => c.horaStr === slot);
  }

  iniciarCita(slot: string): void {
    this.editingSlot = slot;
    this.editingCitaId = null;
    this.newCitaData = {
      paciente: '',
      telefono: '',
      seguro: '',
      observaciones: '',
      colorCita: '#FFFFFF',
      cedula: '',
      recordatorioEnv: false,
    };
  }


  // Guarda la nueva cita (creación)
  guardarCita(slot: string): void {
    const horaFin = this.calcularFin(slot, 30); // 30 minutos por defecto
    const body = {
      idDoctor_cita:this.idDoctor,
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
      cedula: this.newCitaData.cedula || '',
      recordatorioEnv: false
    };

    this.http.post('http://localhost:3000/api/citas/register', body).subscribe({
      next: (resp: any) => {
        console.log('Cita agregada:', resp);
        this.editingSlot = null;
        this.newCitaData = {};
        this.cargarCitas();
      },
      error: (err) => {
        console.error('Error al agregar cita:', err);
      }
    });
  }


   // Método para extraer la hora en formato "HH:mm:00"
   private extraerHora(fechaString: string): string {
    if (!fechaString) return '';
    const match = fechaString.match(/T(\d{2}:\d{2}):/);
    return match ? `${match[1]}:00` : '';
  }

  enviarWhatsApp(cita: any): void {
      let phoneNumber = cita.telefono.trim();
      if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1);
      }
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+593' + phoneNumber;
      }
      const mensaje = `Hola Mundo, tu cita es el día ${this.selectedDate}. Paciente: ${cita.paciente}`;
      this.http.post('http://localhost:3000/api/whatsapp/send', {
        phone: phoneNumber,
        message: mensaje
      }).subscribe({
        next: (resp: any) => {
          console.log('Mensaje enviado:', resp);
          alert('Mensaje de WhatsApp enviado con éxito');
        },
        error: (err) => {
          console.error('Error al enviar WhatsApp:', err);
          alert('No se pudo enviar el mensaje de WhatsApp');
        }
      });
    }
    
    // Método para enviar recordatorio (botón WA2)
    enviarRecordatorio(cita: any): void {
      if (cita.recordatorioEnv) {
        alert('El recordatorio ya fue enviado.');
        return;
      }
      if (!confirm(`¿Está seguro de enviar el recordatorio al paciente "${cita.paciente}"?`)) {
        return;
      }
      let phoneNumber = cita.telefono.trim();
      if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1);
      }
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+593' + phoneNumber;
      }
      const mensaje = `Recordatorio: Se le recuerda que su cita es el día ${this.selectedDate}. Paciente: ${cita.paciente}. Por favor confirme su asistencia.`;
      this.http.post('http://localhost:3000/api/whatsapp/send', {
        phone: phoneNumber,
        message: mensaje
      }).subscribe({
        next: (resp: any) => {
          console.log('Recordatorio enviado:', resp);
          alert('Recordatorio de WhatsApp enviado con éxito');
       
          const updateBody = {
            idDoctor_cita: cita.idDoctor_cita,
            fecha: cita.fecha, 
            torre: cita.torre,
            hora: cita.horaStr,
            horaTermina: cita.horaFinStr,
            paciente: cita.paciente,
            edad: cita.edad,
            telefono: cita.telefono,
            procedimiento: cita.procedimiento,
            imagen: cita.imagen || "",
            pedido: cita.pedido || "",
            institucion: cita.institucion || "",
            seguro: cita.seguro || "",
            estado: cita.estado,
            confirmado: cita.confirmado,
            observaciones: cita.observaciones || "",
            observaciones2: cita.observaciones2 || "",
            colorCita: cita.colorCita,
            cedula: cita.cedula,
            recordatorioEnv: true
          };
          const url = `http://localhost:3000/api/citas/${cita.idCita}`;
          this.http.put(url, updateBody).subscribe({
            next: (resp: any) => {
              console.log('Cita actualizada con recordatorio:', resp);
              this.cargarCitas();
            },
            error: (err) => {
              console.error('Error al actualizar cita con recordatorio:', err);
            }
          });
        },
        error: (err) => {
          console.error('Error al enviar recordatorio:', err);
          alert('No se pudo enviar el recordatorio de WhatsApp');
        }
      });
    }
  
    drop(event: CdkDragDrop<any[]>): void {
      const draggedCita = event.item.data;
      const newSlot = this.timeSlots[event.currentIndex]; // formato "HH:mm:00"
      const newHora = newSlot;
      const newHoraFin = this.calcularFin(newSlot, 30);
    
      // Actualizamos el objeto para enviarlo al backend.
      const updateBody = {
        idDoctor_cita: draggedCita.idDoctor_cita,
        fecha: draggedCita.fecha, // se asume que ya está en formato adecuado
        torre: draggedCita.torre || 1,
        hora: newHora,
        horaTermina: newHoraFin,
        paciente: draggedCita.paciente,
        edad: draggedCita.edad,
        telefono: draggedCita.telefono,
        procedimiento: draggedCita.procedimiento || '',
        imagen: draggedCita.imagen || '',
        pedido: draggedCita.pedido || '',
        institucion: draggedCita.institucion || '',
        seguro: draggedCita.seguro || '',
        estado: draggedCita.estado || 'activo',
        confirmado: draggedCita.confirmado || 'pendiente',
        observaciones: draggedCita.observaciones || '',
        observaciones2: draggedCita.observaciones2 || '',
        colorCita: draggedCita.colorCita,
        cedula: draggedCita.cedula,
        recordatorioEnv: draggedCita.recordatorioEnv || false
      };
    
      // Realizamos el PUT para actualizar la cita con los nuevos horarios.
      const url = `http://localhost:3000/api/citas/${draggedCita.idCita}`;
      this.http.put(url, updateBody).subscribe({
        next: (resp: any) => {
          console.log('Cita actualizada tras drop:', resp);
          this.cargarCitas();
        },
        error: (err) => {
          console.error('Error al actualizar cita tras drop:', err);
        }
      });
    }



   // Guarda la edición de una cita existente (PUT)
   guardarEdicion(): void {
    const url = `http://localhost:3000/api/citas/${this.newCitaData.idCita}`;
    const body = {
      idDoctor_cita: this.idDoctor,
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
      cedula: this.newCitaData.cedula || '',
      recordatorioEnv: this.newCitaData.recordatorioEnv || false
    };

    this.http.put(url, body).subscribe({
      next: (resp: any) => {
        console.log('Cita editada:', resp);
        this.editingCitaId = null;
        this.newCitaData = {};
        this.cargarCitas();
      },
      error: (err) => {
        console.error('Error al editar cita:', err);
      }
    });
  }


    // Modo edición: al presionar el botón de editar (lápiz)
    editarCita(cita: any): void {
      this.editingCitaId = cita.idCita;
      this.editingSlot = cita.horaStr;
      this.newCitaData = { 
        ...cita, 
        hora: cita.horaStr, 
        horaTermina: cita.horaFinStr, 
        cedula: cita.cedula || '',
        recordatorioEnv: cita.recordatorioEnv || false,
        modificado: true
      };
    }
  //-------------------
  cargarTorres(): void {
    this.torreService.getAllTorres().subscribe(
      (data) => {
        this.torres = data;
        if (this.torres.length > 0) {
          this.selectedTorreId = this.torres[0].idTorre; // Seleccionar la primera torre por defecto
          this.cargarCitas(); // Cargar citas de la primera torre
        }
      },
      (error) => console.error('Error al cargar torres:', error)
    );
  }

  verObservaciones(): void {
    // Formatea la fecha
    const formattedDate = formatDate(this.selectedDate);
    // Guarda la fecha formateada en sessionStorage
    sessionStorage.setItem('selectedDate', formattedDate);
    console.log('Fecha guardada:', formattedDate);
    // Navega a la ruta 'observaciones' sin recargar la página
    this.router.navigate(['/observaciones']);
  }

  onDateChange(): void {
    const parsedDate = typeof this.selectedDate === 'string' ? parseISO(this.selectedDate) : this.selectedDate;
    this.formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
    this.cargarCitas();
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
  
  cargarObservaciones(): void {
    this.observacionService.filterObservaciones(this.idDoctor, this.selectedDate).subscribe({
      next: (data: Observacion[]) => {
        console.log("DATA", data); // Verifica la estructura de la respuesta
        if (Array.isArray(data) && data.length > 0) {
          // Asegúrate de que data es un array y tiene al menos un elemento
          this.observaciones = data[0].textObser; // Asigna el valor de textObser
          this.flagObservaciones = true;
          console.log("Observaciones cargadas:", this.observaciones); // Verifica el valor asignado
        } else {
          this.observaciones = ''; 
          this.flagObservaciones = false;
          console.log("No hay observaciones para mostrar.");
        }
      },
      error: (err) => {
        console.error('Error al obtener observaciones:', err);
      }
    });
  }

   guardarObservaciones(): void {
    const nuevaObservacion: Observacion = {
      fechaObser: new Date(),
      textObser: this.observaciones,
      estado: 'Pendiente', 
      docObser: this.idDoctor
    };
    this.observacionService.registerObservacion(nuevaObservacion).subscribe({
      next: (resp) => {
        console.log('Observaciones guardadas:', resp);
        this.cargarObservaciones(); // Llama a la función para recargar las observaciones
      },
      error: (err) => {
        console.error('Error al guardar observaciones:', err);
      }
    });
  }

  selectTorre(torreId: number): void {
    this.selectedTorreId = torreId;
    this.cargarCitas();
  }



// Cancelar edición
cancelarEdicion(): void {
  this.editingCitaId = null;
  this.newCitaData = {};
}

// Cancelar creación de cita
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

// Confirmar cita
confirmarCita(cita: Cita): void {
  this.citaToConfirm = cita;
  this.showConfirmModal = true;
}

eliminarCita(cita: any): void {
  const respuesta = window.confirm(`¿Está seguro de eliminar la cita del paciente "${cita.paciente}"?`);
  if (!respuesta) {
    return;
  }
  const url = `http://localhost:3000/api/citas/${cita.idCita}`;
  this.http.delete(url).subscribe({
    next: (resp: any) => {
      console.log('Cita eliminada:', resp);
      this.cargarCitas();
    },
    error: (err) => {
      console.error('Error al eliminar cita:', err);
    }
  });
}
 // Cuando el usuario elige una opción en el modal:
 handleConfirmOption(opcion: string): void {
  if (opcion === 'cancelar') {
    // Cerrar modal sin hacer nada
    this.showConfirmModal = false;
    this.citaToConfirm = null;
    return;
  }

  // Dependiendo la opción, definimos "nuevoConfirmado" en la tabla cita
  // y "nuevoEstado" en la tabla confirmacion
  let nuevoConfirmado: string;
  let nuevoEstado: string;
  if (opcion === 'si') {
    nuevoConfirmado = 'si';
    nuevoEstado = 'confirmado';
  } else if (opcion === 'no') {
    nuevoConfirmado = 'no';
    nuevoEstado = 'denegado';
  } else if (opcion === 'pendiente') {
    nuevoConfirmado = 'pendiente';
    nuevoEstado = 'pendiente';
  } else {
    // Opción desconocida
    console.log('Opción inválida');
    return;
  }

  
  const updateBody = {
    idDoctor_cita: this.citaToConfirm.idDoctor_cita,
    fecha: this.citaToConfirm.fecha,
    torre: this.citaToConfirm.torre || 1,
    hora: this.citaToConfirm.horaStr,        // "HH:mm:00"
    horaTermina: this.citaToConfirm.horaFinStr, // "HH:mm:00"
    paciente: this.citaToConfirm.paciente,
    edad: this.citaToConfirm.edad,
    telefono: this.citaToConfirm.telefono,
    procedimiento: this.citaToConfirm.procedimiento || '',
    imagen: this.citaToConfirm.imagen || '',
    pedido: this.citaToConfirm.pedido || '',
    institucion: this.citaToConfirm.institucion || '',
    seguro: this.citaToConfirm.seguro || '',
    estado: this.citaToConfirm.estado || 'activo',
    confirmado: nuevoConfirmado,  // "si" | "no" | "pendiente"
    observaciones: this.citaToConfirm.observaciones || '',
    observaciones2: this.citaToConfirm.observaciones2 || '',
    colorCita: this.citaToConfirm.colorCita || '#FFFFFF',
    cedula: this.citaToConfirm.cedula || '',
    recordatorioEnv: this.citaToConfirm.recordatorioEnv || false
  };

  // PUT a la cita
  const urlCita = `http://localhost:3000/api/citas/${this.citaToConfirm.idCita}`;
  this.http.put(urlCita, updateBody).subscribe({
    next: (resp: any) => {
      console.log('Cita actualizada:', resp);

      
      this.crearOActualizarConfirmacion(
        this.citaToConfirm,
        nuevoEstado  // "confirmado" | "denegado" | "pendiente"
      );

      // Recargar la tabla y cerrar el modal
      this.cargarCitas();
      this.showConfirmModal = false;
      this.citaToConfirm = null;
    },
    error: (err) => {
      console.error('Error al actualizar cita:', err);
      alert('No se pudo actualizar la cita');
    }
  });
}

private actualizarCita(cita: Cita): Observable<ApiResponse> {
  return this.citaService.updateCita(cita.idCita!, cita).pipe(
    catchError((error) => {
      console.error('Error al actualizar cita:', error);
      throw new Error('No se pudo actualizar la cita');
    })
  );
}

private crearOActualizarConfirmacion(cita: Cita, estado: string): Observable<ApiResponse> {
  const adminId = this.authService.getAdminId();

  const body: ConfirmacionBody = {
    fechaCita: cita.fecha,
    idMedicoConfirma: adminId,
    confDoctor: cita.idDoctor_cita,
    confTorre1: 'OK',
    fechaConfirma: new Date().toISOString(),
    estado,
  };

  return this.http.post<ApiResponse>('http://localhost:3000/api/citas/confirmacion', body).pipe(
    catchError((error) => {
      console.error('Error al crear/actualizar confirmación:', error);
      throw new Error('No se pudo crear/actualizar la confirmación');
    })
  );
}

private obtenerEstadoConfirmacion(opcion: string): { nuevoConfirmado: boolean; nuevoEstado: string } {
  switch (opcion) {
    case 'si':
      return { nuevoConfirmado: true, nuevoEstado: 'confirmado' };
    case 'no':
      return { nuevoConfirmado: false, nuevoEstado: 'denegado' };
    case 'pendiente':
      return { nuevoConfirmado: false, nuevoEstado: 'pendiente' };
    default:
      return { nuevoConfirmado: false, nuevoEstado: 'invalido' };
  }
}

private cerrarModal(): void {
  this.showConfirmModal = false;
  this.citaToConfirm = new Cita();
}

imprimir() {
  throw new Error('Method not implemented.');
  }
 
}
