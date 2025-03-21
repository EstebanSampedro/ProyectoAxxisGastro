import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {faPrint, faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons'
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Cita } from '../../interfaces/cita';
import { CitaService } from '../../services/cita.service';

@Component({
  selector: 'app-registro-citas',
  templateUrl: './registro-citas.component.html',
  styleUrls: ['./registro-citas.component.css'],
  standalone: false
})
export class RegistroCitasComponent implements OnInit {

  selectedDate: Date = '';
  formattedDate: string = '';
  observaciones: string = '';
  citas: Cita[] = [];
  faPrint = faPrint;
  faSearch = faMagnifyingGlass
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private citaService : CitaService

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

 idDoctor!: string;
   doctorName: string = '';
 
   // Lista de citas (transformadas con horaStr y horaFinStr)
   consultas: any[] = [];
 
   // Slots de 7:00 a 20:00 (cada 30 min)
   timeSlots: string[] = [];
 
   // Para controlar el modo de edición
   editingSlot: string | null = null;
   editingCitaId: number | null = null;
 
   // Objeto que guarda los datos del formulario inline (para nuevo registro o edición)
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
 
   cargarCitas(): void {
    const doctorId = parseInt(this.idDoctor); // Asegúrate de que `idDoctor` sea un número
    this.citaService.getCitasByDoctorAndDate(doctorId, this.selectedDate).subscribe({
      next: (data: Cita[]) => {
        this.consultas = data.map((cita) => {
          const horaStr = this.extraerHora(cita.hora);
          const horaFinStr = this.extraerHora(cita.horaTermina);
          return {
            ...cita,
            horaStr,
            horaFinStr,
            cedula: cita.cedula || '',
            recordatorioEnv: cita.recordatorioEnv || false,
          };
        });
        console.log('Consultas:', this.consultas);
      },
      error: (err) => {
        console.error('Error al obtener consultas:', err);
      },
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
       colorCita: '#FFFFFF',
       cedula: '',
       recordatorioEnv: false
     };
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
 
   guardarCita(slot: string): void {
    const horaFin = this.calcularFin(slot, 30); // 30 minutos por defecto
    const cita: Cita = {
      idDoctor_cita: parseInt(this.idDoctor),
      fecha: this.selectedDate,
      torre: "1",
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
      confirmado: false,
      observaciones: this.newCitaData.observaciones || '',
      observaciones2: '',
      colorCita: this.newCitaData.colorCita || '#FFFFFF',
      cedula: this.newCitaData.cedula || '',
      recordatorioEnv: false,
    };
  
    this.citaService.registerCita(cita).subscribe({
      next: (resp) => {
        console.log('Cita agregada:', resp);
        this.editingSlot = null;
        this.newCitaData = {};
        this.cargarConsultas();
      },
      error: (err) => {
        console.error('Error al agregar cita:', err);
      },
    });
  }
 
  guardarEdicion(): void {
    const cita: Cita = {
      idCita: this.newCitaData.idCita,
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
      cedula: this.newCitaData.cedula || '',
      recordatorioEnv: this.newCitaData.recordatorioEnv || false,
    };
  
    this.citaService.updateCita(this.newCitaData.idCita, cita).subscribe({
      next: (resp) => {
        console.log('Cita editada:', resp);
        this.editingCitaId = null;
        this.newCitaData = {};
        this.cargarConsultas();
      },
      error: (err) => {
        console.error('Error al editar cita:', err);
      },
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
 
   // Propiedades nuevas para controlar el modal de confirmación
   showConfirmModal: boolean = false;
   citaToConfirm: any = null;
 
   confirmarCita(cita: any): void {
     // Abre el modal que muestra 4 botones: SI, NO, PENDIENTE, CANCELAR
     this.citaToConfirm = cita;
     this.showConfirmModal = true; 
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
         this.cargarConsultas();
         this.showConfirmModal = false;
         this.citaToConfirm = null;
       },
       error: (err) => {
         console.error('Error al actualizar cita:', err);
         alert('No se pudo actualizar la cita');
       }
     });
   }
   
   crearOActualizarConfirmacion(cita: any, estado: string): void {
     // ID del admin que está confirmando
     const adminId = this.authService.getAdminId();
   
     const body = {
       fechaCita: cita.fecha,            // "YYYY-MM-DD"
       idMedicoConfirma: adminId,        // ID admin
       confDoctor: cita.idDoctor_cita,   // ID del doctor
       confTorre1: 'OK',
       fechaConfirma: new Date().toISOString(),
       estado // "confirmado" | "denegado" | "pendiente"
     };
   
     this.http.post('http://localhost:3000/api/citas/confirmacion', body).subscribe({
       next: (resp: any) => {
         console.log('Registro de confirmacion:', resp);
       },
       error: (err) => {
         console.error('Error al crear/actualizar confirmacion:', err);
       }
     });
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
         this.cargarConsultas();
       },
       error: (err) => {
         console.error('Error al eliminar cita:', err);
       }
     });
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
             this.cargarConsultas();
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
     // Suponemos que el elemento arrastrado tiene asignado en su propiedad "data" el objeto "cita"
     const draggedCita = event.item.data;
     
     // Determinamos el nuevo slot basándonos en la posición a la que se soltó el elemento.
     // Por ejemplo, suponemos que el índice del contenedor corresponde al índice en el array "timeSlots".
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
         this.cargarConsultas();
       },
       error: (err) => {
         console.error('Error al actualizar cita tras drop:', err);
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
   subirImagen($event: Event) {
    throw new Error('Method not implemented.');
    }
    imprimir() {
    throw new Error('Method not implemented.');
    }
    buscar() {
    throw new Error('Method not implemented.');
    }
}
