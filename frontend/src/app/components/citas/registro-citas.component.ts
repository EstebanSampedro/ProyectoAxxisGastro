import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { format, parseISO, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { faPrint, faMagnifyingGlass, faSave, faWarning, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
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
import { faFloppyDisk, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
// registra los imports necesarios
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';






import {
  faPhone,
  faBell,
  faCheck,
  faPencil,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-registro-citas',
  templateUrl: './registro-citas.component.html',
  styleUrls: ['./registro-citas.component.css'],
  standalone: false
})
export class RegistroCitasComponent implements OnInit {

  faCalendarAlt = faCalendarAlt;
  faSaveAlt = faFloppyDisk;
  faCancelAlt = faTimesCircle;
  showRescheduleModal = false;
  citaToReschedule: any = null;
  rescheduleDate: string = '';
  rescheduleTorre: number = 1;
  rescheduleHour: string = '';
  showSecondObs: boolean = false;
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

  // — Propiedades para el modal de conflicto —
  showConflictModal = false;
  conflictCita: any = null;
  conflictRescheduleDate = '';   // "YYYY-MM-DD"
  conflictRescheduleHour = '';   // "HH:mm:00"
  conflictRescheduleTorre = 1;
  conflict: any = null;


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
    '#808080': 'Gris'
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
    this.conflictRescheduleTorre = this.selectedTorreId;

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
          // 1) filtramos sólo las activas Y de tipo "cita"
          const activas = data.filter(c =>
            c.estado === 'activo' &&
            c.tipoCita === 'cita'
          );

          // 2) mapeamos las que quedan para añadir horaStr, horaFinStr, responsable, etc.
          this.citas = activas.map(cita => {
            const horaStr = this.extraerHora(cita.hora);
            const horaFinStr = this.extraerHora(cita.horaTermina);
            const responsable = cita.idResponsable_idMedico
              ? this.authService.getAdminCode(cita.idResponsable_idMedico)
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

          console.log('Citas activas (solo tipo "cita"):', this.citas);
        },
        error: err => {
          console.error('Error al obtener citas:', err);
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


  guardarCita(slot: string): void {
    // 1) Convertimos la fecha al formato YYYY-MM-DD para pasarla a la API
    const fechaStr = this.selectedDate.toISOString().split('T')[0];

    // 2) Primero comprobamos si hay una CONSULTA ocupando ese slot
    this.citaService.getCitasByDoctorAndDate(+this.selectedDoctorForCita, fechaStr).subscribe({
      next: allCitas => {
        const conflict = allCitas.find(c =>
          c.tipoCita === 'consulta' &&
          this.extraerHora(c.hora) === slot
        );

        if (conflict) {
          // Si existe conflicto, abrimos el modal para reubicar
          this.openConflictModal(conflict, slot);
          return;
        }

        // 4) Si está libre, creamos la CITA:
        const horaFin = this.calcularFin(slot, 30);
        const body = {
          idResponsable_idMedico: this.authService.getAdminId(),
          idDoctor_cita: +this.selectedDoctorForCita,
          fecha: fechaStr,
          torre: this.selectedTorreId,
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
          observaciones2: this.newCitaData.observaciones2 || '',
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
            alert('No se pudo guardar la cita');
          }
        });
      },
      error: err => {
        console.error('Error comprobando citas del doctor:', err);
        alert('No se pudo verificar la disponibilidad del doctor');
      }
    });
  }

  // Cuando detectas el conflicto:
  private openConflictModal(conf: any, slot: string) {
    this.conflict = {
      ...conf,
      horaStr: this.extraerHora(conf.hora),
      horaFinStr: this.extraerHora(conf.horaTermina),
      responsable: conf.idConfirma_idMedico
        ? this.authService.getAdminCode(conf.idConfirma_idMedico)
        : ''
    };
    // Inicializa los controles con valores por defecto
    this.rescheduleTorre = this.selectedTorreId;
    this.rescheduleDate = this.selectedDate.toISOString().split('T')[0];
    this.rescheduleHour = slot;
    this.showConflictModal = true;
  }

  // Cierra el modal sin hacer nada
  closeConflictModal() {
    this.showConflictModal = false;
    this.conflict = null;
  }

  // Confirmar nuevo horario tras conflicto
  confirmNewDate() {
    // 1) Construimos la fecha en YYYY-MM-DD
    const fechaStr = this.rescheduleDate;

    // 2) Tomamos la hora elegida y calculamos horaFin (30m después)
    const slot = this.rescheduleHour;
    const horaFin = this.calcularFin(slot, 30);

    // 3) Preparamos el body EXACTAMENTE igual que en guardarCita()
    const body = {
      idResponsable_idMedico: this.authService.getAdminId(),
      idDoctor_cita: +this.selectedDoctorForCita,
      fecha: fechaStr,
      torre: this.rescheduleTorre,
      hora: slot,
      horaTermina: horaFin,
      paciente: this.newCitaData.paciente || 'Paciente X',
      edad: this.newCitaData.edad || null,
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

    // 4) Llamamos al endpoint de registro de cita
    this.http.post(
      'http://localhost:3000/api/citas/register',
      body
    ).subscribe({
      next: resp => {
        alert('✅ Nueva cita creada correctamente');
        // cerramos modal y reseteamos el estado de edición/creación
        this.closeConflictModal();
        this.editingSlot = null;
        this.newCitaData = {};
        this.cargarCitas();
      },
      error: err => {
        console.error('Error al crear nueva cita tras conflicto:', err);
        alert('No se pudo crear la cita. Inténtalo de nuevo.');
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

enviarWhatsApp(cita: any): void {
  // 1) Formatear teléfono a E.164
  let phone = cita.telefono.trim()
  if (phone.startsWith('0'))   phone = phone.slice(1)
  if (!phone.startsWith('+'))   phone = '+593' + phone

  // 2) Sacar YYYY-MM-DD puro (UTC) y recrear medianoche local
  const ymd = this.selectedDate.toISOString().split('T')[0]  // ej. "2025-06-21"
  const [yyyy, mm, dd] = ymd.split('-').map(n => +n)
  const localMidnight = new Date(yyyy, mm - 1, dd)

  // 3) Formatear fecha para la plantilla
  const fecha = format(
    localMidnight,
    "EEEE dd 'de' MMMM 'del' yyyy",
    { locale: es }
  )
  const hora = cita.horaStr

  // 4) Variables de plantilla
  const paciente = cita.paciente
  const doctor   = this.getDoctorName(cita.idDoctor_cita)

  // 5) Envío
  this.http.post<any>(
    'http://localhost:3000/api/whatsapp/cita/recordatorio',
    { phone, paciente, fecha, hora, doctor }
  ).subscribe({
    next: () => alert('Mensaje de WhatsApp enviado 👍'),
    error: () => alert('No se pudo enviar el recordatorio de cita')
  })
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


  enviarRecordatorio(cita: any): void {
  if (cita.recordatorioEnv) {
    alert('Recordatorio ya enviado.');
    return;
  }
  if (!confirm(`¿Enviar recordatorio a ${cita.paciente}?`)) return;

  let phone = cita.telefono.trim();
  if (phone.startsWith('0')) phone = phone.slice(1);
  if (!phone.startsWith('+')) phone = '+593' + phone;

  const manana = new Date(this.selectedDate);
  manana.setDate(manana.getDate() + 1);
  const fecha = format(manana, "EEEE dd 'de' MMMM 'del' yyyy", { locale: es });
  const hora  = cita.horaStr;
  const doctor = this.getDoctorName(cita.idDoctor_cita);

  this.http
    .post<any>(
      'http://localhost:3000/api/whatsapp/cita/seguimiento',
      { phone, fecha, hora, doctor }
    )
    .subscribe({
      next: () => {
        alert('Recordatorio enviado 👍');
        this.http
          .put(
            `http://localhost:3000/api/citas/${cita.idCita}`,
            { recordatorioEnv: true }
          )
          .subscribe(() => this.cargarCitas());
      },
      error: err => {
        console.error('Error al enviar:', err.error || err);
        alert('No se pudo enviar el recordatorio');
      }
    });
}


  drop(event: CdkDragDrop<any[]>): void {
    const slotDestino = this.timeSlots[event.currentIndex];
    const citaDestino = this.getCitaBySlot(slotDestino);
    if (citaDestino) {
      alert('❌ Ya existe una cita en ese horario. No se puede mover aquí.');
      return;
    }
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
    const fechaStr = this.selectedDate.toISOString().split('T')[0];

    this.http.get(`http://localhost:3000/api/citas/imprimir?f=${fechaStr}`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        },
        error: (err) => {
          console.error('Error generando el PDF:', err);
          alert('No se pudo generar el PDF.');
        }
      });
  }

  // Al pulsar el botón de calendario en la fila en edición
  openRescheduleModal(cita: any) {
    this.citaToReschedule = cita;
    this.rescheduleDate = cita.fecha;      // asumiendo "YYYY-MM-DD"
    this.rescheduleTorre = cita.torre;
    this.rescheduleHour = cita.horaStr;    // "HH:mm:00"
    this.showRescheduleModal = true;
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
    this.citaToReschedule = null;
  }
  /** Lógica de reagendar */
  rescheduleCita() {
    this.citaService
      .getCitasByDateAndTower(this.rescheduleDate, this.rescheduleTorre)
      .subscribe({
        next: citas => {
          const occupied = citas
            .filter(c => c.idCita !== this.citaToReschedule.idCita)
            .some(c => this.extraerHora(c.hora) === this.rescheduleHour);

          if (occupied) {
            return alert('❌ Ya existe otra cita en esta torre/hora.');
          }

          const fechaStr = this.getFechaString(this.rescheduleDate);
          const horaStr = this.getHoraString(this.rescheduleHour);

          console.log('Debug - Datos a enviar:', {
            fecha: fechaStr,
            hora: horaStr,
            torre: this.rescheduleTorre
          });


          const url = `http://192.168.9.8:3000/api/citas/${this.citaToReschedule.idCita}/reagendar`;
          const body = {
            fecha: fechaStr,              // "2025-06-03"
            torre: this.rescheduleTorre,  // 1
            hora: horaStr                 // "08:00:00"
          };

          this.http.patch(url, body).subscribe({
            next: () => {
              alert('✅ Cita reagendada correctamente');
              this.closeRescheduleModal();
              this.editingCitaId = null;
              this.editingSlot = null;
              this.cargarCitas();
            },
            error: err => {
              console.error('Error al reagendar:', err);
              alert('No se pudo reagendar la cita');
            }
          });
        },
        error: err => {
          console.error('Error comprobando disponibilidad:', err);
          alert('No se pudo verificar disponibilidad');
        }
      });
  }

  /**
   * Obtiene la fecha en formato YYYY-MM-DD sin afectaciones de zona horaria
   */
  private getFechaString(date: string | Date): string {
    if (typeof date === 'string') {
      // Si ya es string, verificar que esté en formato correcto
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(date)) {
        return date;
      }
      // Si no está en formato correcto, convertir
      const d = new Date(date);
      return this.formatDateToYMD(d);
    } else {
      // Si es Date object
      return this.formatDateToYMD(date);
    }
  }

  /**
   * Obtiene la hora en formato HH:mm:ss
   * Normaliza la hora ingresada en el formulario
   */
  private getHoraString(hora: string): string {

    if (hora.length === 5 && hora.includes(':')) {
      return `${hora}:00`;
    }

    if (hora.length === 8 && hora.split(':').length === 3) {
      return hora;
    }

    const timeParts = hora.split(':');
    const hours = timeParts[0]?.padStart(2, '0') || '00';
    const minutes = timeParts[1]?.padStart(2, '0') || '00';
    const seconds = timeParts[2]?.padStart(2, '0') || '00';

    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Convierte Date a string YYYY-MM-DD respetando la fecha local
   * SIN aplicar ajustes de zona horaria que puedan cambiar el día
   */
  formatDateToYMD(date: Date): string {
    // Usar métodos locales para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

}