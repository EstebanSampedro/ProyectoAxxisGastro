import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { faPrint, faMagnifyingGlass, faSave, faWarning } from '@fortawesome/free-solid-svg-icons'
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
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';


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
    private citaService: CitaService,
    private observacionService: ObservacionService,
    private torreService: TorreService

  ) { }

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

  // Componentes de archivos
  selectedFiles: File[] = [];
  mostrarModalAdjuntos: boolean = false;
  citaSeleccionada: any = null;

  // Listado de procedimientos para el dropdown / datalist
  procedimientos: string[] = [
    "AMPULECTOMIA ENDOSCOPICA",
    "CAPSULA ENDOSCOPICA",
    "COLANGIO PANCREATOGRAFIA RETROGRADA ENDOSCOPICA (CPRE)",
    "COLOCACION DE BALON INTRAGASTRICO",
    "COLOCACION DE CLIP OVESCO",
    "COLONOSCOPIA  CON COLOCACION DE STENS",
    "COLONOSCOPIA CON CONTROL DE SANGRADO ARGON",
    "COLONOSCOPIA CON CONTROL DE SANGRADO CON ADRENALINA",
    "COLONOSCOPIA CON CONTROL DE SANGRADO-CLIPS",
    "COLONOSCOPIA CON POLIPECTOMIA CON ASA",
    "COLONOSCOPIA DIAGNOSTICA",
    "COLONOSCOPIA MAS DILATACION CON BALON",
    "CPRE + LITOTRIPSIA MECANICA",
    "CPRE + PAPILOTOMIA",
    "CPRE + PAPILOTOMIA + EXTRACCION DE CALCULOS",
    "CPRE + PROTESIS BILIAR O PANCREATICA STENT PLASTICO",
    "CPRE CON ESFINTEROTOMIA Y STENT METALICO",
    "CPRE ENDOSCOPICA CON AMPULECTOMIA",
    "CPRE ENDOSCOPICA CON RETIRO DE STENT",
    "CPRE ENDOSCOPICA ESFINTEROPLASTIA Y EXTRACCION DE CALCULOS",
    "CRECIMIENTO BACTERIANO",
    "DILATACION CON CORTES RADIADOS",
    "DILATACION DE ACALASIA ESOFAGICA",
    "DRENAJE NECROSIS PANCREATICA TRANSGASTRICA",
    "DUODENOSCOPIA",
    "ECOENDOSCOPIA DIAGNOSTICA",
    "ECOENDOSCOPIA DIAGNOSTICA CON MINISONDA",
    "ECOENDOSCOPICO CON PUNCION",
    "ENDOSCOPIA ALTA CON COLOCACION DE STENS EN ESOFAGO",
    "ENDOSCOPIA ALTA CON CONTROL DE HEMORRAGIA CON ADRENALINA",
    "ENDOSCOPIA ALTA CON CONTROL DE HEMORRAGIA CON ARGON",
    "ENDOSCOPIA ALTA CON CONTROL DE HEMORRAGIA CON CLIPS",
    "ENDOSCOPIA ALTA CON DILATACION ESOFAGO CON ACALASIA",
    "ENDOSCOPIA ALTA CON DILATACION ESOFAGO CON SAVARY",
    "ENDOSCOPIA ALTA CON DILATACION GASTRICA CON BALON",
    "ENDOSCOPIA ALTA CON POLIPECTOMIA CON ASA",
    "ENDOSCOPIA ALTA CON POLIPECTOMIA CON PINZA CALIENTE",
    "ENDOSCOPIA DIGESTIVA ALTA",
    "ENDOSCOPIA+COLONOSCOPIA",
    "ENTEROSCOPIA CON BIOPSIA",
    "ENTEROSCOPIA CON CONTROL DE HEMORRAGIA-ADRENALINA",
    "ENTEROSCOPIA CON CONTROL DE HEMORRAGIA-ARGON",
    "ENTEROSCOPIA CON CONTROL DE HEMORRAGIA-CLIPS",
    "ENTEROSCOPIA CON POLIPECTOMIA CON ASA",
    "ENTEROSCOPIA MONOBALON DIAGNOSTICA",
    "ENTEROSCOPIA RETROGRADA DIAGNOSTICA",
    "ESCLEROSIS DE VARICES ESOFAGICAS",
    "EXTRACCION DE CUERPO EXTRAÑO COLONOSCOPIA",
    "EXTRACCION DE CUERPO EXTRAÑO EN NIÑOS",
    "EXTRACCION DE CUERPO EXTRAÑO ENDOSCOPICO",
    "GASTROSTOMIA ENDOSCOPICA PERCUTANEA",
    "INTOLERANCIA A LA FRUCTOSA",
    "INTOLERANCIA A LA LACTOSA",
    "LIGADURA VARICES ESOFAGO CON KIT W.COOK",
    "MANOMETRIA ESOFAGICA",
    "MANOMETRIA RECTAL",
    "MUCOSECTOMIA ESOFAGICA, GASTRICA, COLONICA",
    "PH-METRIA",
    "POLIPECTOMIA CON ASA DE ALTA COMPLEJIDAD",
    "POLIPECTOMIA CON ASA DE BAJA COMPLEJIDAD",
    "RECTOSIGMOIDESOSCOPIA",
    "REEDUCACION ANORECTAL (6 SESIONES)",
    "RETIRO DE BALON GASTRICO",
    "SEPTOTOMIA ENDOSCOPICA EN DIVERTICULO DE ZENKER",
    "TRATAMIENTO ENDOSCOPICO DE SANGRADO DIGESTIVO",
    "TRATAMIENTO ENDOSCOPICO DE VARICES GASTRICAS"
  ];



  flagObservaciones: boolean = false;
  torres: Torre[] = []; // Lista de torres
  selectedTorreId: number = 1; // ID de la torre seleccionada


  // Lista de citas (transformadas con horaStr y horaFinStr)
  consultas: any[] = [];

  // Slots de 7:00 a 20:00 (cada 30 min)
  timeSlots: string[] = [];

  // Para controlar el modo de edición
  editingSlot: string | null = null;
  // Para el dropdown del doctor a asignar en la cita
  doctores: any[] = [];
  selectedDoctorForCita: number = 0; // Este valor se selecciona desde el dropdown
  adminInitials: string = '';

  admins: { idmedico: number; codigoMedico: string }[] = [];





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

  // Carga la lista de doctores para el dropdown (de la tabla doctor2)
  cargarDoctores(): void {
    this.http.get<any[]>('http://localhost:3000/api/doctores').subscribe({
      next: (data) => {
        // Mapear para que la propiedad "doctorId" contenga el ID del doctor (doctor2) y "doctor" su nombre.
        this.doctores = data.map(doc => ({
          doctorId: doc.idDoctor2,
          doctor: doc.nomDoctor2
        }));
      },
      error: (err) => {
        console.error('Error al cargar doctores:', err);
      }
    });
  }

  ngOnInit(): void {
    this.authService.fetchAllAdmins().subscribe({
      error: err => console.error('No cargan admins:', err)
    });
    this.adminInitials = this.authService.getCurrentAdminCode();
    this.idDoctor = obtenerIdDoctorDesdeSessionStorage();
    this.cargarTorres();
    this.generarTimeSlots();
    this.onDateChange();
    this.authService.fetchAllAdmins().subscribe({
      next: () => {
        console.log('Lista de administradores cargada:', this.authService.admins);
        this.cargarCitas(); // Carga las citas después de obtener los administradores
      },
      error: (err) => console.error('Error al cargar administradores:', err),
    });
    this.cargarObservaciones();
    this.cargarDoctores();
  }


  // Método para obtener el nombre del doctor usando el idDoctor_cita (asumiendo que este valor se guardó a partir de la selección en el dropdown)
  // Agrega este método en tu clase RegistroCitasComponent
  getDoctorName(doctorId: number): string {
    if (!this.doctores || this.doctores.length === 0) {
      return '';
    }
    // Buscamos en la lista de doctores el que tenga doctorId igual al idDoctor_cita
    const foundDoctor = this.doctores.find(doc => doc.doctorId === doctorId);
    return foundDoctor ? foundDoctor.doctor : 'No asignado';
  }

  cargarCitas(): void {
    const fechaStr = this.selectedDate.toISOString().split('T')[0];
    this.citaService
      .getCitasByDateAndTower(fechaStr, this.selectedTorreId)
      .subscribe({
        next: data => {
          // 1) filtramos sólo las activas
          const activas = data.filter(cita => cita.estado === 'activo');

          // 2) mapeamos las que quedan para añadir horaStr, etc.
          this.citas = activas.map(cita => {
            const horaStr = this.extraerHora(cita.hora);
            const horaFinStr = this.extraerHora(cita.horaTermina);
            const responsable = cita.idConfirma_idMedico
              ? this.authService.getAdminCode(cita.idConfirma_idMedico)
              : '';
            return {
              ...cita,
              horaStr,
              horaFinStr,
              cedula: cita.cedula || '',
              recordatorioEnv: cita.recordatorioEnv || false,
              responsable
            };
          });

          console.log('Citas activas:', this.citas);
        },
        error: err => console.error('Error al obtener consultas:', err)
      });
  }




  getCitaBySlot(slot: string): any {
    return this.citas.find(c => c.horaStr === slot);
  }

  iniciarCita(slot: string): void {
    this.editingSlot = slot;
    this.editingCitaId = null;
    this.newCitaData = {
      idDoctor_cita: 0,  // Por defecto 0 o vacío
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
    // 1) Convertimos la fecha al formato YYYY-MM-DD para pasar al filtro
    const fechaStr = this.selectedDate.toISOString().split('T')[0];

    // 2) Primero comprobamos si ese doctor ya tiene cita a esa hora ese día
    this.citaService.getCitasByDoctorAndDate(+this.selectedDoctorForCita, fechaStr)
      .subscribe({
        next: citasDoctor => {
          const ocupado = citasDoctor.some(c => this.extraerHora(c.hora) === slot);
          if (ocupado) {
            // Si ya hay una cita a esa hora, abortamos y mostramos advertencia
            return alert('❌ Doctor ocupado en este horario');
          }

          // 3) Si está libre, seguimos con la creación
          const horaFin = this.calcularFin(slot, 30); // 30 minutos por defecto
          const body = {
            idResponsable_idMedico: this.authService.getAdminId(), // quien crea
            idDoctor_cita: +this.selectedDoctorForCita,
            fecha: this.selectedDate,
            torre: this.selectedTorreId,    // ahora sí respetamos la torre activa
            hora: slot,
            horaTermina: horaFin,
            paciente: this.newCitaData.paciente || 'Paciente X',
            edad: this.newCitaData.edad || '',
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
            recordatorioEnv: false,
            tipoCita: 'cita',
            responsable: this.adminInitials
          };

          this.http.post('http://localhost:3000/api/citas/register', body).subscribe({
            next: resp => {
              console.log('Cita agregada:', resp);
              this.editingSlot = null;
              this.newCitaData = {};
              this.cargarCitas();
            },
            error: err => {
              console.error('Error al agregar cita:', err);
            }
          });
        },
        error: err => {
          console.error('Error comprobando citas del doctor:', err);
          alert('No se pudo verificar la disponibilidad. Inténtalo de nuevo.');
        }
      });
  }



  // Método para extraer la hora en formato "HH:mm:00"
  extraerHora(fechaString: string): string {
    if (!fechaString) return '';
    const match = fechaString.match(/T(\d{2}:\d{2}):/);
    return match ? `${match[1]}:00` : '';
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
    // formatea directamente a "YYYY-MM-DD"
    const formattedDate = format(this.selectedDate, 'yyyy-MM-dd');
    this.router.navigate(['/observaciones'], {
      queryParams: { fecha: formattedDate }
    });
  }



  onDateChange(): void {
    const parsedDate = typeof this.selectedDate === 'string' ? parseISO(this.selectedDate) : this.selectedDate;
    this.formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
    this.cargarCitas();
    this.cargarObservaciones();
  }

  onPickerDateChange(newDateStr: string) {
    // newDateStr viene como "YYYY-MM-DD"
    this.selectedDate = new Date(newDateStr);
    this.onDateChange(); // formatea y recarga citas y observaciones
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
    const docId = +this.idDoctor;
    // si selectedDate es Date, lo formateamos, si ya fuera string lo enviaría tal cual
    const fechaParam =
      typeof this.selectedDate === 'string'
        ? this.selectedDate
        : format(this.selectedDate, 'yyyy-MM-dd');

    this.observacionService
      .filterObservaciones(docId, fechaParam)
      .subscribe({
        next: data => {
          if (data.length > 0) {
            this.observaciones = data[0].textObser;
            this.flagObservaciones = true;
          } else {
            this.observaciones = '';
            this.flagObservaciones = false;
          }
        },
        error: err => console.error('Error al obtener observaciones:', err)
      });
  }

  guardarObservaciones(): void {
    // 1) Formatea la fecha seleccionada a "YYYY-MM-DD"
    const fechaStr = format(this.selectedDate, 'yyyy-MM-dd');
    // 2) Crea un Date justo a mediodía (12:00) para neutralizar el offset
    const fechaObs = new Date(`${fechaStr}T12:00:00Z`);

    // 3) Construye el body con Date en fechaObser
    const nuevaObservacion: Observacion = {
      docObser: this.idDoctor,
      fechaObser: fechaObs,    // aquí es un Date legítimo
      textObser: this.observaciones,
      estado: 'Pendiente'
    };

    // 4) Llama al servicio normalmente
    this.observacionService.registerObservacion(nuevaObservacion).subscribe({
      next: () => {
        console.log('Observación guardada/actualizada');
        this.cargarObservaciones();
      },
      error: err => console.error('Error al guardar observación:', err)
    });
  }

  selectTorre(torreId: number): void {
    this.selectedTorreId = torreId;
    this.editingSlot = null;
    this.cargarCitas();
  }

  // BOTÓN #1 WHATSAPP: Si es "consulta" se envía directamente; si es "cita", se abre el modal para adjuntar archivos.
  enviarWhatsApp(cita: any): void {
    let phoneNumber = cita.telefono.trim();
    const doctorNombre = this.getDoctorName(cita.idDoctor_cita);
    if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+593' + phoneNumber;
    }
    const fechaFormateada = format(this.selectedDate, "EEEE dd 'de' MMMM 'del' yyyy", { locale: es });
    let mensaje = '';
    const tipo = cita.tipoCita ? cita.tipoCita.toLowerCase() : '';

    if (tipo === 'consulta') {
      mensaje = `Señor(a) ${cita.paciente}, su cita de consulta médica con ${doctorNombre} ha sido programada para el día ${fechaFormateada} a las ${cita.horaStr}. En el área de gastroenterología primer piso del Hospital Axxis, Av. 10 de agosto N39-155 y Av. América frente al Coral de la Y. Favor se solicita su puntual asistencia el día de la consulta. Además, le comunicamos que un día antes de su consulta se volverá a confirmar.`;
      this.enviarMensajeWhatsapp(phoneNumber, mensaje, null);
    } else if (tipo === 'cita') {
      // Para registros de tipo "cita" (procedimiento), se abre el modal para adjuntar archivos.
      this.citaSeleccionada = cita;
      this.mostrarModalAdjuntos = true;
    } else {
      mensaje = `Hola ${cita.paciente}, su cita está programada para el día ${fechaFormateada} a las ${cita.horaStr}.`;
      this.enviarMensajeWhatsapp(phoneNumber, mensaje, null);
    }
  }

  // Función auxiliar para enviar el mensaje vía WhatsApp
  enviarMensajeWhatsapp(phoneNumber: string, mensaje: string, mediaUrl: string[] | null): void {
    const payload: any = { phone: phoneNumber, message: mensaje };
    if (mediaUrl) {
      payload.mediaUrl = mediaUrl;
    }
    // NOTA: Cambiamos el endpoint para que apunte a /api/whatsapp/send, ya que allí está integrada la subida de archivos
    this.http.post('http://localhost:3000/api/whatsapp/send', payload).subscribe({
      next: resp => {
        console.log('Mensaje enviado:', resp);
        alert('Mensaje de WhatsApp enviado con éxito');
      },
      error: err => {
        console.error('Error al enviar WhatsApp:', err);
        alert('No se pudo enviar el mensaje de WhatsApp');
      }
    });
  }

  // Método para capturar archivos seleccionados desde el input del modal
  onFilesSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  // Cierra el modal de adjuntos y limpia las variables relacionadas
  cerrarModal2(): void {
    this.mostrarModalAdjuntos = false;
    this.selectedFiles = [];
    this.citaSeleccionada = null;
    this.successMessage = '';
  }

  successMessage: string = '';

  // Método para subir archivos y enviar el mensaje con adjuntos para registros de tipo "cita"
  uploadAndSend(cita: any): void {
    if (!this.selectedFiles?.length) {
      alert('Por favor, seleccione al menos un archivo PDF.');
      return;
    }

    const formData = new FormData();

    // 1) Telefono a E.164
    let phoneNumber = this.citaSeleccionada.telefono.trim();
    if (phoneNumber.startsWith('0')) phoneNumber = phoneNumber.substring(1);
    if (!phoneNumber.startsWith('+')) phoneNumber = '+593' + phoneNumber;
    formData.append('phone', phoneNumber);

    // 2) Mensaje
    const fechaFormateada = format(this.selectedDate, "EEEE dd 'de' MMMM 'del' yyyy", { locale: es });
    const doctorNombre = this.getDoctorName(cita.idDoctor_cita);
    const mensaje =
      `Buenos días de AxxisGastro, le saludamos para recordarle su procedimiento *${this.citaSeleccionada.procedimiento}*.
El día ${fechaFormateada} a las ${cita.horaStr} tiene cita para realizarse el procedimiento con ${doctorNombre}.
  
Por motivos de verificación del examen, le solicitamos enviar una foto legible del pedido médico y proporcionar los siguientes datos del paciente:
  • Nombres completos
  • Número de cédula de ciudadanía
  • Fecha de nacimiento
  
El ingreso al parqueadero es por la calle Vozandes y la salida por la Avenida 10 de agosto. Tome en cuenta que el hospital se encuentra en una zona de alto tráfico; recomendamos tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el día del procedimiento; de lo contrario, deberá acudir posteriormente para solicitar el documento. En caso de dudas sobre el examen, contáctenos.

Por favor, confirme su asistencia. En caso de no recibir respuesta, su procedimiento será cancelado.`;
    formData.append('message', mensaje);

    // 3) Archivos
    this.selectedFiles.forEach(file => {
      formData.append('files', file, file.name);
    });

    // 4) Petición
    this.http.post<any>('http://localhost:3000/api/whatsapp/send', formData).subscribe({
      next: uploadRes => {
        if (uploadRes.success) {
          // 5a) Mensaje interno
          this.successMessage = '¡Mensaje de WhatsApp con archivo(s) enviado con éxito!';

          // 5b) Marcamos recordatorioEnv = true
          const updateBody = {
            idDoctor_cita: this.citaSeleccionada.idDoctor_cita,
            fecha: this.citaSeleccionada.fecha,
            torre: this.citaSeleccionada.torre,
            hora: this.citaSeleccionada.horaStr,
            horaTermina: this.citaSeleccionada.horaFinStr,
            paciente: this.citaSeleccionada.paciente,
            edad: this.citaSeleccionada.edad,
            telefono: this.citaSeleccionada.telefono,
            procedimiento: this.citaSeleccionada.procedimiento,
            imagen: this.citaSeleccionada.imagen || "",
            pedido: this.citaSeleccionada.pedido || "",
            institucion: this.citaSeleccionada.institucion || "",
            seguro: this.citaSeleccionada.seguro || "",
            estado: this.citaSeleccionada.estado,
            confirmado: this.citaSeleccionada.confirmado,
            observaciones: this.citaSeleccionada.observaciones || "",
            observaciones2: this.citaSeleccionada.observaciones2 || "",
            colorCita: this.citaSeleccionada.colorCita,
            cedula: this.citaSeleccionada.cedula,
            recordatorioEnv: true
          };
          const urlPut = `http://localhost:3000/api/citas/${this.citaSeleccionada.idCita}`;
          this.http.put(urlPut, updateBody).subscribe({
            next: () => this.cargarCitas(),
            error: err => console.error('Error actualizando cita:', err)
          });

          // 5c) Cerrar modal y limpiar tras 3 segundos
          setTimeout(() => {
            this.cerrarModal2();
          }, 3000);

        } else {
          // Aquí podrías mostrar otro mensaje si quieres
          this.successMessage = 'No se pudo enviar el mensaje de WhatsApp.';
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: err => {
        console.error('Error al enviar WhatsApp:', err);
        this.successMessage = 'Error de red al enviar WhatsApp.';
        setTimeout(() => this.successMessage = '', 3000);
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

    // Prepara el número de teléfono en formato E.164
    let phoneNumber = cita.telefono.trim();
    if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+593' + phoneNumber;
    }

    // Obtener la fecha de mañana a partir de this.selectedDate (formato "YYYY-MM-DD")
    const fechaObj = new Date(this.selectedDate);
    fechaObj.setDate(fechaObj.getDate() + 1);
    const fechaMananaFormateada = format(fechaObj, "EEEE dd 'de' MMMM 'del' yyyy", { locale: es });

    // Construir el mensaje según el tipo de cita
    let mensaje = '';
    const tipo = cita.tipoCita ? cita.tipoCita.toLowerCase() : '';

    const doctorNombre = this.getDoctorName(cita.idDoctor_cita);


    if (tipo === 'consulta') {
      // Diferencia de mensajes según el doctor: evaluamos this.doctorName (ya cargado en el componente)
      if (doctorNombre.toLowerCase().includes("marco luna")) {
        // Mensaje para DR. MARCO LUNA (consulta)
        mensaje =
          `Buenas tardes de Axxis Gastro, le saludamos de parte del consultorio del Dr. Marco Luna. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.

El valor de la consulta médica es de $50 dólares, que lo puede cancelar en efectivo o transferencia bancaria.
El ingreso al parqueadero actualmente es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.

Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.

Tome en cuenta que el hospital se encuentra ubicado en una zona de alto tráfico; recomendamos tener presente las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; caso contrario, tendrá que acercarse posteriormente para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;

      } else if (doctorNombre.toLowerCase().includes("coello")) {
        // Mensaje para DR. COELLO (consulta) y dependiente de seguro
        if (!cita.seguro || cita.seguro.trim() === "") {
          mensaje =
            `Buenos días de Axxis Gastro, le saludamos de parte del consultorio del Dr. Ramiro Coello. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr} de la mañana.

El valor de la consulta es de $60 dólares, que lo puede cancelar en efectivo o transferencia bancaria.
El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.

Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.

Tome en cuenta que el hospital se encuentra en una zona de alto tráfico; se recomienda tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; caso contrario, deberá acercarse posteriormente para solicitar el documento.

Por favor, confirme su cita. En el caso de no tener respuesta, su consulta será cancelada.`;
        } else {
          mensaje =
            `Buenos días de Axxis Gastro, le saludamos de parte del consultorio del Dr. Ramiro Coello. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr} de la mañana.
El valor de la consulta lo puede cancelar en efectivo o transferencia bancaria, de acuerdo al copago que tenga con su seguro médico.

El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.
Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.
Tome en cuenta que el hospital se encuentra en una zona de alto tráfico; se recomienda tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; caso contrario, deberá acercarse posteriormente para solicitar el documento.

Nota: si usted es paciente de SALUD S.A, tenga en cuenta las siguientes recomendaciones:
  • El doctor aplica el copago en consulta con el plan CERO TRÁMITES y bajo reembolso.
  • El doctor no trabaja con el plan ODAS.
Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;
        }
      } else if (doctorNombre.toLowerCase().includes("cargua")) {
        // Mensaje para DR. OSWALDO CARGUA
        mensaje =
          `Buenos días de Axxis Gastro, le saludamos de parte del consultorio del Dr. Oswaldo Cargua. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.
El valor de la consulta médica lo puede cancelar en efectivo o transferencia bancaria.

El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.
Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.
Tome en cuenta que el hospital se encuentra ubicado en una zona de alto tráfico; se recomienda tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; caso contrario, deberá acercarse posteriormente para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;
      } else if (doctorNombre.toLowerCase().includes("orellana")) {
        // Mensaje para DRA. IVONNE ORELLANA
        mensaje = `Buenos días de Axxis Gastro, le saludamos de parte del consultorio de la Dra. Ivonne Orellana. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.
El valor de la consulta médica lo puede cancelar en efectivo o transferencia bancaria.

El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.
Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.
Tome en cuenta que el hospital se encuentra ubicado en una zona de alto tráfico; recomendamos tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; de lo contrario, deberá acercarse presencialmente luego para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;

      } else if (doctorNombre.toLowerCase().includes("escudero")) {
        // Mensaje para DRA. PÍA ESCUDERO
        mensaje = `Buenos días de Axxis Gastro, le saludamos de parte del consultorio de la Dra. Pía Escudero. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.
El valor de la consulta médica lo puede cancelar en efectivo o transferencia bancaria.

El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.
Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.
Tome en cuenta que el hospital se encuentra ubicado en una zona de alto tráfico; recomendamos tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; de lo contrario, deberá acercarse presencialmente luego para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;

      } else if (doctorNombre.toLowerCase().includes("castillo flamain")) {
        // Mensaje para DR. CARLOS CASTILLO FLAMAIN
        mensaje = `Buenos días de Axxis Gastro, le saludamos de parte del consultorio del Dr. Carlos Castillo Flamain. Por recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.
Por favor, si dispone de resultados recientes o antiguos (laboratorio, rayos X u otra especialidad) que el doctor aún no haya revisado referentes a su estado de salud, acuda con una copia física. Estos resultados serán anexados a su historia clínica y servirán como antecedente en su tratamiento.
Recuerde que el valor de la consulta lo puede cancelar en cheque, efectivo o transferencia. Por favor, ayude facilitando la búsqueda de su historia clínica proporcionando los nombres completos del paciente.

Anexo enlace de la ubicación de Axxis Gastro: https://maps.app.goo.gl/q9HtZ6ZrnEG83RjV9 

Actualmente, el ingreso es por la calle Vozandes y la salida por la Avenida 10 de agosto. El consultorio del doctor está ubicado en: Primer piso, Torre de hospitalización, Consultorio 119, Unidad de gastroenterología (Axxis Gastro) junto a Medical Track.
Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;


      } else {
        mensaje = `Buenos días de Axxis Gastro, le saludamos de parte del consultorio de ${this.doctorName}. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.
El valor de la consulta médica lo puede cancelar en efectivo o transferencia bancaria.

El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto. Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.
Tome en cuenta que el hospital se encuentra en una zona de alto tráfico; recomendamos tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; de lo contrario, deberá acercarse presencialmente luego para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;
      }

    } else if (tipo === 'cita') {
      // En la interfaz CITAS, para tipo "cita" (procedimiento)
      mensaje = `Buenos días de AxxisGastro, le saludamos para recordarle su procedimiento ${cita.procedimiento}.
    
El día de mañana ${fechaMananaFormateada} a las ${cita.horaStr} tiene su cita para realizar el procedimiento con ${doctorNombre}.
    
Por motivos de verificación del examen, por favor envíenos una foto legible del pedido médico y proporcione los siguientes datos del paciente:
    • Nombres completos:
    • Número de cédula de ciudadanía:
    • Fecha de nacimiento:
    
El ingreso al parqueadero es por la calle Vozandes actualmente, y la salida es por la Avenida 10 de agosto. Tome en cuenta que el hospital se encuentra en una zona de alto tráfico, por lo que recomendamos tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día del procedimiento; de lo contrario, deberá acercarse posteriormente para solicitar el documento. En caso de dudas respecto al examen, por favor comuníquese con nosotros.

Por favor, confirme su asistencia. En caso de no recibir respuesta, su procedimiento será cancelado.`;

    } else {
      // Mensaje por defecto
      mensaje = `Hola ${cita.paciente}, recuerde que mañana tiene su consulta médica a las ${cita.horaStr}. Por favor, confirme su asistencia.`;
    }

    // Enviar el mensaje a través del endpoint de WhatsApp en el backend
    this.http.post('http://localhost:3000/api/whatsapp/send', {
      phone: phoneNumber,
      message: mensaje
    }).subscribe({
      next: (resp: any) => {
        console.log('Recordatorio enviado:', resp);
        alert('Recordatorio de WhatsApp enviado con éxito');

        // Actualizar la cita para marcar que ya se envió el recordatorio
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
      torre: draggedCita.torre,
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

  private crearLog(citaId: number, tipo: 'edicion' | 'eliminacion'): Observable<any> {
    const body = {
      cita_idCita: citaId,
      tipoCambio: tipo,
      medico_idMedico: this.authService.getAdminId()
    };
    return this.http.post('http://localhost:3000/api/citas/logs', body);
  }

  private readonly BASE = 'http://localhost:3000/api/citas';

  // Guarda la edición de una cita existente (PUT)
  /** Guarda la edición de una cita existente (PUT) y luego crea un log de tipo 'edicion' */
  guardarEdicion(): void {
    const id = this.newCitaData.idCita!;
    const urlCita = `${this.BASE}/${id}`;
    const body = {
      idDoctor_cita: this.newCitaData.idDoctor_cita ? +this.newCitaData.idDoctor_cita : 0,
      fecha: this.selectedDate,
      torre: this.selectedTorreId,
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

    this.http.put<ApiResponse>(urlCita, body).pipe(
      // sólo si el PUT sale bien creamos el log
      switchMap(() => {
        const logBody = {
          cita_idCita: id,
          tipoCambio: 'edicion',
          medico_idMedico: this.authService.getAdminId()
        };
        return this.http.post<ApiResponse>(
          `${this.BASE}/logs`,
          logBody
        ).pipe(
          catchError(err => {
            console.error('Error creando log de edición:', err);
            return of(null);
          })
        );
      })
    ).subscribe({
      next: () => {
        console.log('Cita editada y (posible) log creado');
        this.editingCitaId = null;
        this.newCitaData = {};
        this.cargarCitas();
      },
      error: err => {
        console.error('Error al editar cita:', err);
        alert('No se pudo editar la cita');
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
    if (!confirm(`¿Está seguro de eliminar la cita de "${cita.paciente}"?`)) {
      return;
    }

    // 1) Soft‑delete en el backend
    this.http
      .patch(
        `http://localhost:3000/api/citas/${cita.idCita}/eliminar`,
        { medico_idMedico: this.authService.getAdminId() }
      )
      .pipe(
        // 2) Luego creamos el log
        switchMap(() => this.crearLog(cita.idCita, "eliminacion"))
      )
      .subscribe({
        next: () => {
          console.log("Cita eliminada y log creado");
          this.cargarCitas();
        },
        error: (err) => {
          console.error("Error al eliminar cita o crear log:", err);
          alert("No se pudo eliminar la cita");
        }
      });
  }

  // Cuando el usuario elige una opción en el modal:
  handleConfirmOption(opcion: string): void {
    if (opcion === 'cancelar') {
      this.showConfirmModal = false;
      this.citaToConfirm = null as any;
      return;
    }

    // Determinar valores según la opción
    let nuevoConfirmado: string;
    let nuevoEstado: string;
    if (opcion === 'si') {
      nuevoConfirmado = 'si';
      nuevoEstado = 'confirmado';
    } else if (opcion === 'no') {
      nuevoConfirmado = 'no';
      nuevoEstado = 'denegado';
    } else {
      nuevoConfirmado = 'pendiente';
      nuevoEstado = 'pendiente';
    }

    // 1) Armar el body para actualizar la cita
    const updateBody = {
      idConfirma_idMedico: this.authService.getAdminId(),
      idDoctor_cita: this.citaToConfirm.idDoctor_cita,
      fecha: this.citaToConfirm.fecha,
      torre: this.citaToConfirm.torre,
      hora: this.citaToConfirm.horaStr,
      horaTermina: this.citaToConfirm.horaFinStr,
      paciente: this.citaToConfirm.paciente,
      edad: this.citaToConfirm.edad,
      telefono: this.citaToConfirm.telefono,
      procedimiento: this.citaToConfirm.procedimiento || '',
      imagen: this.citaToConfirm.imagen || '',
      pedido: this.citaToConfirm.pedido || '',
      institucion: this.citaToConfirm.institucion || '',
      seguro: this.citaToConfirm.seguro || '',
      estado: this.citaToConfirm.estado || 'activo',
      confirmado: nuevoConfirmado,
      observaciones: this.citaToConfirm.observaciones || '',
      observaciones2: this.citaToConfirm.observaciones2 || '',
      colorCita: this.citaToConfirm.colorCita || '#FFFFFF',
      cedula: this.citaToConfirm.cedula || '',
      recordatorioEnv: this.citaToConfirm.recordatorioEnv || false
    };

    const urlCita = `http://localhost:3000/api/citas/${this.citaToConfirm.idCita}`;

    // 2) Primero actualizamos la cita, luego creamos/actualizamos la confirmación
    this.http.put(urlCita, updateBody).pipe(
      switchMap(() => {
        // Armar body de confirmación
        const body: ConfirmacionBody = {
          fechaCita: this.citaToConfirm.fecha,
          idMedicoConfirma: this.authService.getAdminId(),
          confDoctor: this.citaToConfirm.idDoctor_cita,
          confTorre1: 'OK',
          fechaConfirma: new Date().toISOString(),
          estado: nuevoEstado
        };
        // POST a /api/citas/confirmacion
        return this.http.post<ApiResponse>(
          'http://localhost:3000/api/citas/confirmacion',
          body
        );
      })
    ).subscribe({
      next: () => {
        console.log('Cita y confirmación actualizadas correctamente');
        this.cargarCitas();
        this.showConfirmModal = false;
        this.citaToConfirm = null as any;
      },
      error: err => {
        console.error('Error al actualizar cita o confirmación:', err);
        alert('Ocurrió un problema al confirmar la cita');
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
    // Convertir la fecha seleccionada a "YYYY-MM-DD"
    const fechaStr = this.selectedDate.toISOString().split('T')[0];
    // Llama al endpoint del backend para generar el PDF
    // Ajusta la URL de acuerdo a la ruta y dominio de tu backend
    window.open(`http://localhost:3000/api/citas/imprimir?f=${fechaStr}`, '_blank');
  }

}
