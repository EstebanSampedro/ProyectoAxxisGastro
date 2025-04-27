import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { format, parseISO, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthService } from '../../services/auth.service'; 
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { formatDate, obtenerIdDoctorDesdeSessionStorage } from '../../shared/common';
import { Cita } from '../../interfaces/cita';
import { ConfirmacionBody } from '../../interfaces/confirmacionBody';
import { ApiResponse } from '../../interfaces/apiResponse';
import { Observable } from 'rxjs/internal/Observable';
import { catchError } from 'rxjs/internal/operators/catchError';
import {faPrint, faMagnifyingGlass,faSave, faWarning, faCalendarAlt, faFloppyDisk, faTimesCircle} from '@fortawesome/free-solid-svg-icons'
import { Torre } from '../../interfaces/torre';
import { TorreService } from '../../services/torres.service';
import { Observacion } from '../../interfaces/observacion.general';
import { ObservacionService } from '../../services/observaciones.generales.service';
import { CitaService } from '../../services/cita.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';



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
  currentObservacionId: number | null = null;


  // Lista de citas (transformadas con horaStr y horaFinStr)
  consultas: any[] = [];

  // Slots de 7:00 a 20:00 (cada 30 min)
  timeSlots: string[] = [];

  // Para controlar el modo de edición
  editingSlot: string | null = null;
  editingCitaId: number | null = null;
  faPrint = faPrint;
  faSearch = faMagnifyingGlass
  faSave = faSave;
  faWarning = faWarning;

  faCalendarAlt = faCalendarAlt;
  faSaveAlt   = faFloppyDisk;
  faCancelAlt = faTimesCircle;

    //Propiedades para reagendar ---
    citaToReschedule: any        = null;
    rescheduleDate:   string     = '';
    rescheduleTorre:  number     = 1;
    rescheduleHour:   string     = '';
    showRescheduleModal = false;
    rescheduleEndHour!: string;



  // Objeto que guarda los datos del formulario inline (para nuevo registro o edición)
  newCitaData: any = {};
  adminInitials: string = '';
  admins: { idmedico: number; codigoMedico: string }[] = [];


  flagObservaciones: boolean = false;
  torres: Torre[] = []; // Lista de torres
  selectedTorreId: number = 1; // ID de la torre seleccionada

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
    private http: HttpClient,
    private authService: AuthService,
    private observacionService : ObservacionService,
    private torreService: TorreService,
    private citaService : CitaService


  ) {}

  ngOnInit(): void {
    
    this.authService.fetchAllAdmins().subscribe({
      error: err => console.error('No cargan admins:', err)
    });

    this.idDoctor = this.route.snapshot.paramMap.get('idDoctor') || '';
    this.generarTimeSlots();

    const hoy = new Date();
    this.selectedDate = hoy.toISOString().split('T')[0];
    this.onDateChange();

    this.cargarNombreDoctor();
    this.cargarConsultas();
    this.cargarTorres();
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

  cargarTorres(): void {
    this.torreService.getAllTorres().subscribe(
      (data) => {
        this.torres = data;
        if (this.torres.length > 0) {
          this.selectedTorreId = this.torres[0].idTorre; // Seleccionar la primera torre por defecto
          this.cargarConsultas(); // Cargar citas de la primera torre
        }
      },
      (error) => console.error('Error al cargar torres:', error)
    );
  }

  selectTorre(torreId: number): void {
    this.selectedTorreId = torreId;
    this.editingSlot = null;
    this.cargarConsultas();
  }

  onDateChange(): void {
    const parsedDate = parseISO(this.selectedDate);
    this.formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
    this.cargarConsultas();
    this.cargarObservaciones();
  }

  
    onPickerDateChange(newDateStr: string) {
      // newDateStr viene como "YYYY-MM-DD"
      this.selectedDate = newDateStr;  // <— sigue siendo string
      this.onDateChange(); // formatea y recarga citas y observaciones
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

  /** Crea un log de tipo 'edicion' o 'eliminacion' */
private crearLog(citaId: number, tipo: 'edicion'|'eliminacion'): Observable<any> {
  const body = {
    cita_idCita:     citaId,
    tipoCambio:      tipo,
    medico_idMedico: this.authService.getAdminId()
  };
  return this.http.post('http://localhost:3000/api/citas/logs', body).pipe(
    catchError(err => {
      console.error(`Error creando log de ${tipo}:`, err);
      return of(null);
    })
  );
}


cargarConsultas(): void {
  const fechaStr = this.selectedDate;           // "YYYY-MM-DD"
  const doctorId = parseInt(this.idDoctor, 10); // id del doctor actual

  // 1) Trae TODAS las citas de ese doctor y fecha (sin torre)
  this.citaService.getCitasByDoctorAndDate(doctorId, fechaStr)
    .subscribe({
      next: data => {
        // 2) Filtra sólo las activas y de tipo "consulta" o "cita"
        const filtradas = data.filter(c =>
          c.estado !== 'eliminado' &&
          (c.tipoCita === 'consulta' || c.tipoCita === 'cita')
        );

        // 3) Mapea para añadir horaStr, horaFinStr, responsable…
        this.consultas = filtradas.map(cita => ({
          ...cita,
          horaStr:    this.extraerHora(cita.hora),
          horaFinStr: this.extraerHora(cita.horaTermina),
          cedula:          cita.cedula           || '',
          recordatorioEnv: cita.recordatorioEnv  || false,
          responsable:     cita.idConfirma_idMedico
                             ? this.authService.getAdminCode(cita.idConfirma_idMedico)
                             : ''
        }));
      },
      error: err => console.error('Error al obtener consultas:', err)
    });
}





  // Extrae la hora en formato "HH:mm:00" de una cadena tipo "1970-01-01T08:00:00.000Z"
  extraerHora(fechaString: string): string {
    if (!fechaString) return '';
    const match = fechaString.match(/T(\d{2}:\d{2}):/);
    return match ? `${match[1]}:00` : '';
  }

    verObservaciones(): void {
      // Formatea la fecha
      const fechaDate = parseISO(this.selectedDate);
      const formattedDate = formatDate(fechaDate);
      // Guarda la fecha formateada en sessionStorage
      sessionStorage.setItem('selectedDate', formattedDate);
      console.log('Fecha guardada:', formattedDate);
      // Navega a la ruta 'observaciones' sin recargar la página
      this.router.navigate(['/observaciones']);
    }

    cargarObservaciones(): void {
      this.http.get<any[]>(`http://localhost:3000/api/observaciones/filter`, {
        params: {
          doctorId: this.idDoctor,
          fecha:    this.selectedDate
        }
      }).subscribe({
        next: data => {
          if (data.length > 0) {
            const obs = data[0];
            this.currentObservacionId = obs.idObser;    // guardamos el id
            this.observaciones        = obs.textObser;  // mostramos el texto
            this.flagObservaciones    = true;
          } else {
            this.currentObservacionId = null;
            this.observaciones        = '';
            this.flagObservaciones    = false;
          }
        },
        error: err => console.error('Error al obtener observaciones:', err)
      });
    }
    
    /** Guarda o actualiza la observación del día */
    guardarObservaciones(): void {
      const body = {
        docObser:   +this.idDoctor,
        fechaObser: this.selectedDate,
        textObser:  this.observaciones,
        estado:     'Pendiente'
      };
    
      if (this.currentObservacionId) {
        // --> ACTUALIZAR
        this.http.put(
          `http://localhost:3000/api/observaciones/${this.currentObservacionId}`,
          body
        ).subscribe({
          next: () => this.cargarObservaciones(),
          error: err => console.error('Error al actualizar observación:', err)
        });
      } else {
        // --> CREAR NUEVO
        this.http.post(
          'http://localhost:3000/api/observaciones/register',
          body
        ).subscribe({
          next: () => this.cargarObservaciones(),
          error: err => console.error('Error al crear observación:', err)
        });
      }
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
  editarConsulta(cita: any): void {
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


// Guarda la nueva consulta (creación)
guardarCita(slot: string): void {
  const fechaStr = this.selectedDate;                // "YYYY-MM-DD"
  const doctorIdNum = parseInt(this.idDoctor, 10);
  const adminId     = this.authService.getAdminId();

  // 1) Primero comprobamos en todas las torres si el doctor ya tiene cita a esa hora ese día
  this.citaService.getCitasByDoctorAndDate(doctorIdNum, fechaStr)
    .subscribe({
      next: citasDoctor => {
        const ocupado = citasDoctor.some(c => this.extraerHora(c.hora) === slot);
        if (ocupado) {
          return alert('❌ Doctor ocupado en este horario');
        }

        // 2) Si está libre, seguimos con la creación
        const horaFin = this.calcularFin(slot, 30);
        const body = {
          idResponsable_idMedico: adminId,
          idDoctor_cita: doctorIdNum,
          fecha: fechaStr,
          torre: this.selectedTorreId,
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
          tipoCita: 'consulta'
        };

        this.http.post('http://localhost:3000/api/citas/register', body).subscribe({
          next: resp => {
            console.log('Consulta agregada:', resp);
            this.editingSlot = null;
            this.newCitaData = {};
            this.cargarConsultas();
          },
          error: err => {
            console.error('Error al agregar consulta:', err);
            alert('No se pudo guardar la consulta.');
          }
        });
      },
      error: err => {
        console.error('Error comprobando disponibilidad:', err);
        alert('No se pudo verificar la disponibilidad. Inténtalo de nuevo.');
      }
    });
}



  // Guarda la edición de una cita existente (PUT)
  guardarEdicion(): void {
    const id = this.newCitaData.idCita!;
    const url = `http://localhost:3000/api/citas/${id}`;
    const adminId = this.authService.getAdminId();
  
    const body = {
      idResponsable_idMedico: adminId,
      idDoctor_cita:          parseInt(this.idDoctor, 10),
      fecha:                  this.selectedDate,
      torre:                  this.selectedTorreId,
      hora:                   this.newCitaData.hora,
      horaTermina:            this.newCitaData.horaTermina,
      paciente:               this.newCitaData.paciente    || 'Paciente X',
      edad:                   this.newCitaData.edad        || 30,
      telefono:               this.newCitaData.telefono    || '',
      procedimiento:          this.newCitaData.procedimiento || '',
      imagen:                 this.newCitaData.imagen      || '',
      pedido:                 this.newCitaData.pedido      || '',
      institucion:            this.newCitaData.institucion || '',
      seguro:                 this.newCitaData.seguro      || '',
      estado:                 this.newCitaData.estado      || 'activo',
      confirmado:             this.newCitaData.confirmado  || 'pendiente',
      observaciones:          this.newCitaData.observaciones || '',
      observaciones2:         this.newCitaData.observaciones2 || '',
      colorCita:              this.newCitaData.colorCita   || '#FFFFFF',
      cedula:                 this.newCitaData.cedula      || '',
      recordatorioEnv:        this.newCitaData.recordatorioEnv || false
    };
  
    this.http.put(url, body).pipe(
      switchMap(() => this.crearLog(id, 'edicion'))
    ).subscribe({
      next: () => {
        console.log('Cita editada y log de edición creado');
        this.editingCitaId = null;
        this.newCitaData   = {};
        this.cargarConsultas();
      },
      error: err => console.error('Error al editar cita o crear log:', err)
    });
  }

  eliminarConsulta(cita: any): void {
    if (!confirm(`¿Está seguro de eliminar la cita de "${cita.paciente}"?`)) {
      return;
    }
  
    this.http
      .patch(
        `http://localhost:3000/api/citas/${cita.idCita}/eliminar`,
        { medico_idMedico: this.authService.getAdminId() }
      )
      .pipe(
        switchMap(() => this.crearLog(cita.idCita, "eliminacion"))
      )
      .subscribe({
        next: () => {
          console.log("Cita marcada como eliminada y log creado");
          this.cargarConsultas();
        },
        error: err => {
          console.error("Error al eliminar cita o crear log:", err);
          alert("No se pudo eliminar la cita");
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
    const adminId = this.authService.getAdminId();

  
    
    const updateBody = {
      idConfirma_idMedico: adminId,
      idDoctor_cita: this.citaToConfirm.idDoctor_cita,
      fecha: this.citaToConfirm.fecha,
      torre: this.citaToConfirm.torre,
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
  


  enviarWhatsApp(cita: any): void {
    // Prepara el número de teléfono (formato E.164)
    let phoneNumber = cita.telefono.trim();
    if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+593' + phoneNumber;
    }
  
    // Construir el mensaje de WhatsApp según el tipo de cita
    const parsedDate = parse(this.selectedDate, "yyyy-MM-dd", new Date());
    const fechaFormateada = format(parsedDate, "EEEE dd 'de' MMMM 'del' yyyy", { locale: es });
    let mensaje = '';
    const tipo = cita.tipoCita ? cita.tipoCita.toLowerCase() : '';
  
    if (tipo === 'consulta') {
      // Mensaje para CONSULTA
      mensaje = `Señor(a) ${cita.paciente}, su cita de consulta médica con Dr(a) ${this.doctorName} ha sido programada para el día ${fechaFormateada} a las ${cita.horaStr}. En el área de gastroenterología primer piso del Hospital Axxis, Av. 10 de agosto N39-155 y Av. América frente al Coral de la Y. Favor se solicita su puntual asistencia el día de la consulta. Además, le comunicamos que un día antes de su consulta se volverá a confirmar.`;
    } else if (tipo === 'cita') {
      // Mensaje para CITA (procedimiento)
      mensaje = 
      `Señor(a) ${cita.paciente} de Axxisgastro le saludamos para recordarle: el día ${fechaFormateada} a las ${cita.horaStr} usted tiene cita para realizarse el procedimiento *${cita.procedimiento}* con Dr(a). ${this.doctorName}.
      
Para el día del examen debe acudir con 45 minutos de anticipación a la hora señalada del procedimiento.
      
Debe acudir máximo con un familiar o un acompañante. Es obligatorio traer pedido el médico original y la cédula de ciudadanía. Debe seguir las indicaciones adjuntas al pie de la letra.
      
Adicionalmente, por favor confírmenos si toma las siguientes pastillas:
      • Presión
      • Tiroides
      • Problemas cardíacos
      • Diabetes
      • Anticoagulantes`
    } else {
      // Si no es ninguno de los anteriores, usa un mensaje por defecto
      mensaje = `Hola ${cita.paciente}, su cita está programada para el día ${this.selectedDate} a las ${cita.horaStr}.`;
    }
  
    // Envía el mensaje vía el endpoint de WhatsApp en el backend
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
  
  
  
  enviarRecordatorio(cita: any): void {
    if (cita.recordatorioEnv) {
      alert('El recordatorio ya fue enviado.');
      return;
    }
    if (!confirm(`¿Está seguro de enviar el recordatorio al paciente "${cita.paciente}"?`)) {
      return;
    }
  
    // Formateo del número (asegura formato E.164)
    let phoneNumber = cita.telefono.trim();
    if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+593' + phoneNumber;
    }
  
    // Obtener la fecha de mañana (basada en la fecha seleccionada)
    const fechaHoy = new Date(this.selectedDate);
    fechaHoy.setDate(fechaHoy.getDate() + 1);
    // Utilizamos date-fns para formatear la fecha en español
    const fechaMananaFormateada = format(fechaHoy, "EEEE dd 'de' MMMM 'del' yyyy", { locale: es });
    
    let mensaje = '';
    const tipo = cita.tipoCita ? cita.tipoCita.toLowerCase() : '';
  
    // Diferencia de mensajes según el doctor: evaluamos this.doctorName (ya cargado en el componente)
    if (this.doctorName.toLowerCase().includes("marco luna")) {
      // Mensaje para DR. MARCO LUNA (consulta)
      mensaje = 
  `Buenas tardes de Axxis Gastro, le saludamos de parte del consultorio del Dr. Marco Luna. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.

El valor de la consulta médica es de $50 dólares, que lo puede cancelar en efectivo o transferencia bancaria.
El ingreso al parqueadero actualmente es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.

Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.

Tome en cuenta que el hospital se encuentra ubicado en una zona de alto tráfico; recomendamos tener presente las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; caso contrario, tendrá que acercarse posteriormente para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;
    
    } else if (this.doctorName.toLowerCase().includes("coello")) {
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
    } else if (this.doctorName.toLowerCase().includes("cargua")) {
      // Mensaje para DR. OSWALDO CARGUA
      mensaje =
  `Buenos días de Axxis Gastro, le saludamos de parte del consultorio del Dr. Oswaldo Cargua. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.
El valor de la consulta médica lo puede cancelar en efectivo o transferencia bancaria.

El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.
Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.
Tome en cuenta que el hospital se encuentra ubicado en una zona de alto tráfico; se recomienda tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; caso contrario, deberá acercarse posteriormente para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;
    } else if (this.doctorName.toLowerCase().includes("orellana")) {
    // Mensaje para DRA. IVONNE ORELLANA
    mensaje = `Buenos días de Axxis Gastro, le saludamos de parte del consultorio de la Dra. Ivonne Orellana. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.
El valor de la consulta médica lo puede cancelar en efectivo o transferencia bancaria.

El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.
Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.
Tome en cuenta que el hospital se encuentra ubicado en una zona de alto tráfico; recomendamos tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; de lo contrario, deberá acercarse presencialmente luego para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;

  } else if (this.doctorName.toLowerCase().includes("escudero")) {
    // Mensaje para DRA. PÍA ESCUDERO
    mensaje = `Buenos días de Axxis Gastro, le saludamos de parte del consultorio de la Dra. Pía Escudero. Para recordarle que el día de mañana ${fechaMananaFormateada} tiene cita para consulta médica a las ${cita.horaStr}.
El valor de la consulta médica lo puede cancelar en efectivo o transferencia bancaria.

El ingreso al parqueadero es por la calle Vozandes, y la salida es por la Avenida 10 de agosto.
Por favor, ayúdenos con los nombres completos del paciente y con el número de cédula o pasaporte en caso de ser extranjero.
Tome en cuenta que el hospital se encuentra ubicado en una zona de alto tráfico; recomendamos tomar las debidas precauciones y llegar oportunamente.
Si desea certificado médico por su asistencia, hágalo saber en recepción el mismo día de la consulta; de lo contrario, deberá acercarse presencialmente luego para solicitar el documento.

Por favor, confirme su asistencia. En el caso de no tener respuesta, su consulta será cancelada.`;

  } else if (this.doctorName.toLowerCase().includes("flamain")) {
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
  
    // Envía el recordatorio vía el endpoint de WhatsApp
    this.http.post('http://localhost:3000/api/whatsapp/send', {
      phone: phoneNumber,
      message: mensaje
    }).subscribe({
      next: (resp: any) => {
        console.log('Recordatorio enviado:', resp);
        alert('Recordatorio de WhatsApp enviado con éxito');
        
        // Actualiza la cita para marcar que ya se envió el recordatorio
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

  openRescheduleModal(cita: any, slot: string) {
    this.citaToReschedule = cita;
    this.rescheduleDate   = cita.fecha;           // p.ej. "2025-04-27"
    this.rescheduleHour   = slot;                 // p.ej. "10:00:00"
    this.rescheduleEndHour =
      this.calcularFin(this.rescheduleHour, 30);   // "10:30:00"
    this.rescheduleTorre  = this.selectedTorreId;
    this.showRescheduleModal = true;
  }

  updateEndHour(newHour: string) {
    this.rescheduleEndHour = this.calcularFin(newHour, 30);
  }

  // --- 1.3 Cerrar modal ---
  closeRescheduleModal() {
    this.showRescheduleModal = false;
    this.citaToReschedule    = null;
  }


  rescheduleCita(): void {
    const fechaStr = this.rescheduleDate; // "YYYY-MM-DD" (string)
  
    // 1) Comprobar que no choque con otra consulta (mismo día y hora)
    this.citaService.getCitasByDate(fechaStr).subscribe({
      next: allCitas => {
        const otroChoque = allCitas
          .filter(c => c.idCita !== this.citaToReschedule.idCita)
          .some(c => this.extraerHora(c.hora) === this.rescheduleHour);
  
        if (otroChoque) {
          alert('❌ Ya existe otra consulta en esa fecha y hora.');
          return;
        }
  
        // 2) Calculamos la hora de fin original sumando 30 min
        const endOriginal = this.calcularFin(this.rescheduleHour, 30); // e.g. "10:30:00"
  
        // 3) Aplicamos offset –5h a hora de inicio
        const [h, m] = this.rescheduleHour.split(':').map(n => +n);
        const dtStart = new Date(Date.UTC(1970, 0, 1, h, m));
        dtStart.setUTCHours(dtStart.getUTCHours() - 5);
        const hhStart = dtStart.getUTCHours().toString().padStart(2, '0');
        const mmStart = dtStart.getUTCMinutes().toString().padStart(2, '0');
        const horaOffset    = `${hhStart}:${mmStart}:00`;
  
        // 4) Aplicamos offset –5h a hora de fin
        const [eh, em] = endOriginal.split(':').map(n => +n);
        const dtEnd = new Date(Date.UTC(1970, 0, 1, eh, em));
        dtEnd.setUTCHours(dtEnd.getUTCHours() - 5);
        const hhEnd = dtEnd.getUTCHours().toString().padStart(2, '0');
        const mmEnd = dtEnd.getUTCMinutes().toString().padStart(2, '0');
        const horaFinOffset = `${hhEnd}:${mmEnd}:00`;
  
        // 5) Enviamos el PATCH con fecha, torre (la original), hora y horaTermina
        const body = {
          fecha:       fechaStr,
          torre:       this.citaToReschedule.torre,
          hora:        horaOffset,
          horaTermina: horaFinOffset
        };
  
        this.http
          .patch(
            `http://localhost:3000/api/citas/${this.citaToReschedule.idCita}/reagendar`,
            body
          )
          .subscribe({
            next: () => {
              alert('✅ Consulta reagendada correctamente');
              this.closeRescheduleModal();
              // Salir de cualquier modo edición/creación
              this.editingCitaId = null;
              this.editingSlot   = null;
              this.cargarConsultas();
            },
            error: err => {
              console.error('Error al reagendar consulta:', err);
              alert('No se pudo reagendar la consulta');
            }
          });
      },
      error: err => {
        console.error('Error comprobando consultas existentes:', err);
        alert('No se pudo verificar conflicto con otras consultas');
      }
    });
  }




  // Métodos de navegación del menú
  goToInicio(): void {
    this.router.navigate(['/menu']);;
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
