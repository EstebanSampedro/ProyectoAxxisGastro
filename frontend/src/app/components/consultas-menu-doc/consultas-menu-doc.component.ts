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
import { faPrint, faMagnifyingGlass, faSave, faWarning, faCalendarAlt, faFloppyDisk, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { Torre } from '../../interfaces/torre';
import { TorreService } from '../../services/torres.service';
import { Observacion } from '../../interfaces/observacion.general';
import { ObservacionService } from '../../services/observaciones.generales.service';
import { CitaService } from '../../services/cita.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

interface SlotView {
  slot: string;           // texto “HH:mm:ss” que mostramos en la primera columna
  type: 'appointment'     // cita normal
  | 'empty'          // hueco estándar que respeta slotDurationMin
  | 'custom-empty';  // hueco extra entre horas, siempre editable
  cita?: any;             // datos de cita cuando type==='appointment'
}


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

  timeSlots: string[] = [];
  slotViews: SlotView[] = [];
  slotDurationMin = 30;  // duración fija de cada slot
  editingSlotIndex: number | null = null; // índice del slot que se está editando
  errorSlots: SlotView[] = [];


  // Para controlar el modo de edición
  editingSlot: string | null = null;
  editingCitaId: number | null = null;
  faPrint = faPrint;
  faSearch = faMagnifyingGlass
  faSave = faSave;
  faWarning = faWarning;


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
  // slot “fantasma” para errores
  errorSlot: SlotView | null = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private observacionService: ObservacionService,
    private torreService: TorreService,
    private citaService: CitaService


  ) { }

  ngOnInit(): void {
    // Cargamos admins y doctor
    this.authService.fetchAllAdmins().subscribe({ error: err => console.error(err) });
    this.idDoctor = this.route.snapshot.paramMap.get('idDoctor') || '';

    // Generamos slots y fijamos fecha
    this.generarTimeSlots();
    const hoy = new Date();
    this.selectedDate = hoy.toISOString().split('T')[0];

    // Disparamos carga de consultas y observaciones
    this.onDateChange();
    this.cargarNombreDoctor();
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
    const url = `http://192.168.9.8:3000/api/doctores/${this.idDoctor}`;
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
  private crearLog(citaId: number, tipo: 'edicion' | 'eliminacion'): Observable<any> {
    const body = {
      cita_idCita: citaId,
      tipoCambio: tipo,
      medico_idMedico: this.authService.getAdminId()
    };
    return this.http.post('http://192.168.9.8:3000/api/citas/logs', body).pipe(
      catchError(err => {
        console.error(`Error creando log de ${tipo}:`, err);
        return of(null);
      })
    );
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
    this.http.get<any[]>(`http://192.168.9.8:3000/api/observaciones/filter`, {
      params: {
        doctorId: this.idDoctor,
        fecha: this.selectedDate
      }
    }).subscribe({
      next: data => {
        if (data.length > 0) {
          const obs = data[0];
          this.currentObservacionId = obs.idObser;    // guardamos el id
          this.observaciones = obs.textObser;  // mostramos el texto
          this.flagObservaciones = true;
        } else {
          this.currentObservacionId = null;
          this.observaciones = '';
          this.flagObservaciones = false;
        }
      },
      error: err => console.error('Error al obtener observaciones:', err)
    });
  }

  /** Guarda o actualiza la observación del día */
  guardarObservaciones(): void {
    const body = {
      docObser: +this.idDoctor,
      fechaObser: this.selectedDate,
      textObser: this.observaciones,
      estado: 'Pendiente'
    };

    if (this.currentObservacionId) {
      // --> ACTUALIZAR
      this.http.put(
        `http://192.168.9.8:3000/api/observaciones/${this.currentObservacionId}`,
        body
      ).subscribe({
        next: () => this.cargarObservaciones(),
        error: err => console.error('Error al actualizar observación:', err)
      });
    } else {
      // --> CREAR NUEVO
      this.http.post(
        'http://192.168.9.8:3000/api/observaciones/register',
        body
      ).subscribe({
        next: () => this.cargarObservaciones(),
        error: err => console.error('Error al crear observación:', err)
      });
    }
  }


  //-----------------------------------------------------------------------------------------------------
  // CRUD Consultas

  /**
   *  getCitaBySlot(slot: string): any {
    return this.consultas.find(c => c.horaStr === slot);
  }**/
  /** Carga las citas + consultas y reconstruye la vista de slots */
  cargarConsultas(): void {
  // Limpia antes de cargar
  this.errorSlots = [];
  this.consultas  = [];
  this.slotViews  = [];

  const fechaStr = this.selectedDate;               // "YYYY-MM-DD"
  const doctorId = parseInt(this.idDoctor, 10);
  // NOTA: ya no usamos this.selectedTorreId aquí, para traer todas las torres

  forkJoin({
    citas:     this.citaService.getCitasActivas(fechaStr, doctorId),
    consultas: this.citaService.getConsultasActivas(fechaStr, doctorId)
  }).pipe(
    map(({ citas, consultas }) => {
      const mapSlot = (c: any) => {
        const horaStr    = this.extraerHora(c.hora);
        const horaFinStr = this.extraerHora(c.horaTermina);
        // 👉 Aquí obtenemos el código (iniciales) del admin que creó el registro:
        const responsable = c.idResponsable_idMedico
          ? this.authService.getAdminCode(c.idResponsable_idMedico)
          : '';

        return {
          ...c,
          horaStr,
          horaFinStr,
          responsable       // ✅ ahora cada cita/consulta tiene su “responsable”
        };
      };

      // 1) Mapear todas las citas regulares (tipo “cita”)
      const citasNorm = citas.normal.map(mapSlot);

      // 2) Filtrar consultas (tipo “consulta”) que no empalmen con ninguna cita
      const citaHoras     = new Set(citasNorm.map(c => c.horaStr));
      const consultasNorm = consultas.normal
        .map(mapSlot)
        .filter(c => !citaHoras.has(c.horaStr));

      // 3) Unir ambas colecciones en un solo arreglo “normales”
      const normales = [...citasNorm, ...consultasNorm];

      // 4) Hacer lo mismo para los registros con “error” en confirmado
      const citasErr     = citas.errors.map(mapSlot);
      const errHoras     = new Set(citasErr.map(c => c.horaStr));
      const consultasErr = consultas.errors
        .map(mapSlot)
        .filter(c => !errHoras.has(c.horaStr));
      const errores = [...citasErr, ...consultasErr];

      return { normales, errores };
    })
  ).subscribe({
    next: ({ normales, errores }) => {
      // Guardamos las “consultas con error” para mostrar alertas, etc.
      this.errorSlots = errores.map(c => ({
        slot: '00:00:00',
        type: 'appointment' as const,
        cita: c
      }));
      // Asignamos a this.consultas el conjunto combinado de citas+consultas
      this.consultas = normales;
      // Reconstruimos la vista de slots con buildSlotViews()
      this.buildSlotViews();
    },
    error: err => console.error('Error cargando citas y consultas:', err)
  });
}


  /** Genera los slots cada slotDurationMin desde startHour hasta endHour */
  generarTimeSlots(): void {
    const startHour = 7;  // hora de inicio
    const endHour = 21; // hora de fin
    this.timeSlots = [];

    for (let h = startHour; h <= endHour; h++) {
      for (let m of [0, this.slotDurationMin]) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        this.timeSlots.push(`${hh}:${mm}:00`);
      }
    }
  }

  /** Convierte "HH:mm:ss" a minutos desde medianoche */
  private timeToMinutes(hhmmss: string): number {
    const [h, m] = hhmmss.split(':').map(Number);
    return h * 60 + m;
  }

  /** Construye slotViews sin huecos extra y hasta la última cita */
  private buildSlotViews(): void {
    const slotMin = this.slotDurationMin;
    const sorted = [...this.consultas]
      .sort((a, b) => this.timeToMinutes(a.horaStr) - this.timeToMinutes(b.horaStr));

    this.slotViews = [];
    let skip = 0, ci = 0;

    for (let slot of this.timeSlots) {
      if (skip > 0) { skip--; continue; }
      const baseMin = this.timeToMinutes(slot);
      const cita = sorted[ci];

      if (cita) {
        const startMin = this.timeToMinutes(cita.horaStr);
        // Si arranca dentro de este slot base…
        if (startMin >= baseMin && startMin < baseMin + slotMin) {
          // 1) Usamos la hora exacta de la cita en vez del slot
          const rowSlot = cita.horaStr;

          // 2) Inyectamos color según tipo
          const citaConColor = {
            ...cita,
            colorCita: cita.tipoCita === 'cita'
              ? '#FF3F38'
              : (cita.colorCita || '#FFFFFF')
          };

          this.slotViews.push({
            slot: rowSlot,
            type: 'appointment',
            cita: citaConColor
          });

          // 3) Saltamos los slots que ocupa
          const endMin = this.timeToMinutes(cita.horaFinStr);
          const durSlots = Math.ceil((endMin - startMin) / slotMin);
          skip = durSlots - 1;
          ci++;
          continue;
        }
      }

      // Si no hay cita en este slot → vacio
      this.slotViews.push({ slot, type: 'empty' });
      // y hueco editable
      this.slotViews.push({ slot, type: 'custom-empty' });
    }
  }


  /** Combina errores (provenientes de errorSlots) y slotViews */
  get displaySlots(): SlotView[] {
    return [...this.errorSlots, ...this.slotViews];
  }

  /** Devuelve la cita solo en el slot inicial (para binding en el template) */
  getViewByIndex(i: number): SlotView {
    return this.slotViews[i];
  }

  iniciarCita(index: number): void {
    this.editingSlotIndex = index;
    this.editingCitaId = null;
    // pre-set con slot y por defecto +30 min
    const base = this.slotViews[index].slot; // e.g. "08:00:00"
    this.newCitaData = {
      hora: base.substr(0, 5),
      horaTermina: this.calcularFin(base, this.slotDurationMin),
      paciente: '',
      telefono: '',
      seguro: '',
      observaciones: '',
      colorCita: '#FFFFFF',
      cedula: '',
      recordatorioEnv: false
    };
  }

  guardarCita(index: number): void {
    const fechaStr = this.selectedDate;
    const doctorId = +this.idDoctor;
    const adminId = this.authService.getAdminId();
    let { hora, horaTermina } = this.newCitaData;

    // 1) Validar que existan ambas horas
    if (!hora || !horaTermina) {
      return alert('Debes indicar hora de inicio y hora de fin');
    }

    // 2) Normalizar formato "HH:mm:00"
    const fmtFull = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(p => p.padStart(2, '0'));
      return `${h}:${m}:00`;
    };
    hora = fmtFull(hora);
    horaTermina = fmtFull(horaTermina);

    // 3) Validar orden de tiempos
    const toMin = (s: string) => {
      const [H, M] = s.split(':').map(Number);
      return H * 60 + M;
    };
    const startMin = toMin(hora), endMin = toMin(horaTermina);
    if (endMin <= startMin) {
      return alert('La hora de fin debe ser posterior a la de inicio');
    }

    // 4) Comprobar solapamiento
    this.citaService.getCitasByDoctorAndDate(doctorId, fechaStr).pipe(
      map(citasDoc =>
        citasDoc
          .filter(c => c.estado === 'activo' && c.tipoCita === 'consulta') // Filtrar citas relevantes
          .some(c => {
            const exStart = toMin(this.extraerHora(c.hora));
            const exEnd = toMin(this.extraerHora(c.horaTermina));
            // Validar si hay solapamiento
            return startMin < exEnd && endMin > exStart;
          })
      ),
      switchMap(overlap => {
        // 5) Construir el body
        const body = {
          idResponsable_idMedico: adminId,
          idDoctor_cita: doctorId,
          fecha: fechaStr,
          torre: this.selectedTorreId,
          hora,
          horaTermina,
          paciente: this.newCitaData.paciente || 'Paciente X',
          edad: this.newCitaData.edad ?? null,
          telefono: this.newCitaData.telefono || '',
          procedimiento: this.newCitaData.procedimiento || '',
          imagen: this.newCitaData.imagen || '',
          pedido: this.newCitaData.pedido || '',
          institucion: this.newCitaData.institucion || '',
          seguro: this.newCitaData.seguro || '',
          estado: 'activo',
          confirmado: overlap ? 'error' : 'pendiente',
          observaciones: this.newCitaData.observaciones || '',
          observaciones2: '',
          colorCita: overlap ? '#ffff00' : (this.newCitaData.colorCita || 'amarillo-opaco'),
          cedula: this.newCitaData.cedula || '',
          recordatorioEnv: false,
          tipoCita: 'consulta'
        };

        // 6) POST para registrar la cita
        return this.http.post<{ idCita: number }>(
          'http://192.168.9.8:3000/api/citas/register',
          body
        );
      })
    ).subscribe({
      next: () => {
        // 7) Limpiar estado y recargar desde BD
        this.editingSlotIndex = null;
        this.newCitaData = {};
        this.cargarConsultas();
      },
      error: err => {
        if (err.message !== 'Solapamiento detectado') {
          console.error('Error creando la cita:', err);
          alert('Ocurrió un error al guardar la cita.');
        }
      }
    });
  }

  editarConsulta(view: SlotView, idx: number): void {
    const cita = view.cita!;
    this.editingCitaId = cita.idCita;
    this.editingSlotIndex = null;
    this.newCitaData = {
      ...cita,
      hora: cita.horaStr,
      horaTermina: cita.horaFinStr,
      cedula: cita.cedula || '',
      recordatorioEnv: cita.recordatorioEnv || false
    };
  }

  eliminarConsulta(cita: any): void {
    const id = cita?.idCita;
    if (!id) {
      return alert('No se pudo eliminar: ID de cita inválido');
    }
    if (!confirm(`¿Está seguro de eliminar la cita de "${cita.paciente}"?`)) {
      return;
    }
    this.http
      .patch(`http://192.168.9.8:3000/api/citas/${id}/eliminar`, { medico_idMedico: this.authService.getAdminId() })
      .pipe(switchMap(() => this.crearLog(id, 'eliminacion')))
      .subscribe({
        next: () => {
          this.cargarConsultas();
        },
        error: err => {
          console.error('Error al eliminar cita o crear log:', err);
          alert('No se pudo eliminar la cita');
        }
      });
  }


  guardarEdicion(): void {
    const id = this.newCitaData.idCita;
    if (!id) {
      return alert('No se pudo editar: ID de cita inválido');
    }
    const url = `http://192.168.9.8:3000/api/citas/${id}`;
    const adminId = this.authService.getAdminId();

    // 1) Extraer y validar horas
    let { hora, horaTermina } = this.newCitaData;
    if (!hora || !horaTermina) {
      return alert('Debes indicar hora de inicio y hora de fin');
    }

    // 2) Formatear a "HH:mm:00"
    const formatFull = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(p => p.padStart(2, '0'));
      return `${h}:${m}:00`;
    };
    hora = formatFull(hora);
    horaTermina = formatFull(horaTermina);

    // 3) Validar orden
    const toMin = (s: string) => {
      const [H, M] = s.split(':').map(Number);
      return H * 60 + M;
    };
    if (toMin(horaTermina) <= toMin(hora)) {
      return alert('La hora de fin debe ser posterior a la de inicio');
    }

    // 4) Armar el body usando las horas formateadas
    const body = {
      idResponsable_idMedico: adminId,
      idDoctor_cita: +this.idDoctor,
      fecha: this.selectedDate,
      torre: this.selectedTorreId,
      hora,
      horaTermina,
      paciente: this.newCitaData.paciente || 'Paciente X',
      edad: this.newCitaData.edad ?? 30,
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
      recordatorioEnv: !!this.newCitaData.recordatorioEnv
    };

    this.http.put(url, body).pipe(
      switchMap(() => this.crearLog(id, 'edicion'))
    ).subscribe({
      next: () => {
        this.editingCitaId = null;
        this.newCitaData = {};
        this.cargarConsultas();
      },
      error: err => {
        console.error(err);
        alert('Error editando la cita');
      }
    });
  }


  // Cancelar edición o creación
  cancelarEdicion(): void {
    this.editingCitaId = null;
    this.newCitaData = {};
  }
  cancelarCita(): void {
    this.editingSlotIndex = null;
    this.newCitaData = {};
  }

  //-----------------------------------------------------------------------------------------------------
  // Lógica de confirmaciones
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
    const urlCita = `http://192.168.9.8:3000/api/citas/${this.citaToConfirm.idCita}`;
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

    return this.http.post<ApiResponse>('http://192.168.9.8:3000/api/citas/confirmacion', body).pipe(
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
    this.http.post('http://192.168.9.8:3000/api/whatsapp/send', {
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
    this.http.post('http://192.168.9.8:3000/api/whatsapp/send', {
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

        const url = `http://192.168.9.8:3000/api/citas/${cita.idCita}`;
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

  // -----------------------------------------------------------------------------------------------------
  //Propiedades para reagendar ---
  citaToReschedule: any = null;
  rescheduleDate: string = '';
  rescheduleTorre: number = 1;
  rescheduleHour: string = '';
  showRescheduleModal = false;
  rescheduleEndHour!: string;

  faCalendarAlt = faCalendarAlt;
  faSaveAlt = faFloppyDisk;
  faCancelAlt = faTimesCircle;
  // Métodos para el modal de reagendar cita
  // Abre el modal y pre‐carga *sin* segundos, usando horaStr/ horaFinStr
  openRescheduleModal(cita: any) {
    this.citaToReschedule = cita;
    this.rescheduleDate = cita.fecha;                // "YYYY-MM-DD"
    // substr(0,5) = "HH:mm"
    this.rescheduleHour = cita.horaStr.substr(0, 5);
    this.rescheduleEndHour = cita.horaFinStr.substr(0, 5);
    this.rescheduleTorre = cita.torre;
    this.showRescheduleModal = true;
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
    this.citaToReschedule = null;
  }

  /** Retorna true si hora fin ≤ hora inicio (ambas en "H:MM"/"HH:MM") */
  isEndBeforeStart(): boolean {
    const toMin = (s: string) => {
      const [H, M] = s.split(':').map(Number);
      return H * 60 + M;
    };
    if (!this.rescheduleHour || !this.rescheduleEndHour) return false;
    return toMin(this.rescheduleEndHour) <= toMin(this.rescheduleHour);
  }

  /**
   * Reagenda una cita considerando hora de inicio y hora de fin ingresadas manualmente,
   * validando solapamientos con otras citas y consultas en la misma fecha/torre.
   */
  rescheduleCita(): void {
    const cita = this.citaToReschedule;
    if (!cita?.idCita) {
      return alert('ID de cita inválido');
    }

    // 1) Obtener valores ingresados
    const fechaRaw = this.rescheduleDate;        // Puede ser string "YYYY-MM-DD" o Date
    const torre = this.rescheduleTorre;           // número
    let startRaw = this.rescheduleHour;           // "H:mm" ó "HH:mm" ó incluso "HH:mm:ss"
    let endRaw = this.rescheduleEndHour;          // "H:mm" ó "HH:mm" ó incluso "HH:mm:ss"

    // 2) Validaciones básicas de campos
    if (!fechaRaw || !startRaw || !endRaw) {
      return alert('Por favor, completa todos los campos (fecha, hora inicio, hora fin y torre).');
    }

    // 3) Obtener strings normalizados de fecha e hora (YYYY-MM-DD y HH:mm:ss)
    const fecha = this.getFechaString(fechaRaw);
    const horaStr = this.getHoraString(startRaw);
    const horaTermStr = this.getHoraString(endRaw);

    // 4) Convertir a minutos para comparar rangos
    const newStartMin = this.convertToMinutes(horaStr);      // Ej: "08:30:00" → 510
    const newEndMin = this.convertToMinutes(horaTermStr);     // Ej: "09:15:00" → 555

    if (newEndMin <= newStartMin) {
      return alert('La hora fin debe ser posterior a la hora inicio.');
    }

    // 5) Traer todas las citas/consultas de ese día y torre
    this.citaService.getCitasByDateAndTower(fecha, torre).subscribe({
      next: allCitas => {
        // 6) Validar solapamiento: newStart < existEnd && newEnd > existStart
        const overlap = allCitas
          .filter(c => c.idCita !== cita.idCita)   // Excluir la misma cita que vamos a reagendar
          .some(c => {
            const existStartStr = this.extraerHora(c.hora);           // "HH:mm" extraído de c.hora ("HH:mm:ss")
            const existEndStr = this.extraerHora(c.horaTermina);      // "HH:mm" extraído de c.horaTermina ("HH:mm:ss")
            const existStartMin = this.convertToMinutes(existStartStr + ':00');
            const existEndMin = this.convertToMinutes(existEndStr + ':00');

            return (newStartMin < existEndMin) && (newEndMin > existStartMin);
          });

        if (overlap) {
          return alert('❌ Este rango de horas solapa con otra cita/consulta en la misma torre.');
        }

        // 7) Si no hay solapamiento, enviar PATCH al backend
        const url = `http://192.168.9.8:3000/api/citas/${cita.idCita}/reagendar`;
        const body = {
          fecha: fecha,               // "YYYY-MM-DD"
          torre: torre,               // número
          hora: horaStr,              // "HH:mm:ss"
          horaTermina: horaTermStr    // "HH:mm:ss"
        };

        console.log('Debug - Datos a enviar para reagendar:', body);

        this.http.patch(url, body).subscribe({
          next: () => {
            alert('✅ Cita reagendada correctamente');
            this.closeRescheduleModal();
            this.editingCitaId = null;
            this.editingSlot = null;
            this.cargarConsultas();
          },
          error: err => {
            console.error('Error al reagendar:', err);
            alert('No se pudo reagendar la cita. Inténtalo nuevamente.');
          }
        });
      },
      error: err => {
        console.error('Error comprobando disponibilidades:', err);
        alert('No se pudo verificar conflictos con otras citas/consultas.');
      }
    });
  }

  /**
   * Convierte un string de hora "HH:mm:ss" o "HH:mm" a minutos totales desde medianoche.
   * Ejemplo: "08:30:00" → 8*60 + 30 = 510.
   */
  private convertToMinutes(hora: string): number {
    // Asegurarse de tener formato "HH:mm:ss"
    const parts = hora.split(':').map(p => parseInt(p, 10));
    let h = 0, m = 0;
    if (parts.length >= 2) {
      h = parts[0];
      m = parts[1];
    }
    return h * 60 + m;
  }

  /**
   * Obtiene la fecha en formato YYYY-MM-DD sin afectaciones de zona horaria.
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
   * Obtiene la hora en formato HH:mm:ss.
   * Normaliza la hora ingresada en el formulario ("H:mm", "HH:mm", "HH:mm:ss", etc.).
   */
  private getHoraString(hora: string): string {
    // Si viene en "H:mm" o "HH:mm", convertir a "HH:mm:00"
    if (/^\d{1,2}:\d{2}$/.test(hora)) {
      const [h, m] = hora.split(':');
      return `${h.padStart(2, '0')}:${m}:${'00'}`;
    }
    // Si viene en "HH:mm:ss", validar
    if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) {
      return hora;
    }
    // Si es algún otro formato, intentar parsear y formatear
    const parts = hora.split(':');
    const hours = parts[0]?.padStart(2, '0') || '00';
    const minutes = parts[1]?.padStart(2, '0') || '00';
    const seconds = parts[2]?.padStart(2, '0') || '00';
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Convierte un objeto Date a string "YYYY-MM-DD" respetando la fecha local,
   * sin aplicar ajustes de zona horaria que cambien el día.
   */
  formatDateToYMD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // -----------------------------------------------------------------------------------------------------
  // Método para mover la cita al soltarla en el nuevo slot

  /** drop(event: CdkDragDrop<any[]>): void {
     const dragged: any = event.item.data;
     // 1) índice en displaySlots
     const target = this.displaySlots[event.currentIndex];
     if (!dragged?.idCita) return alert('ID de cita inválido');
 
     // 2) nueva hora de inicio = slot del target
     const newStart = target.slot;               // "HH:mm:ss"
     // 3) conservar duración original
     const toMin = (s: string) => {
       const [H, M] = s.split(':').map(Number);
       return H * 60 + M;
     };
     const oldStartMin = toMin(dragged.horaStr);
     const oldEndMin = toMin(dragged.horaFinStr);
     const durMin = oldEndMin - oldStartMin;
 
     // 4) calcular nueva hora fin
     const calculateEnd = (start: string, dur: number) => {
       const [h, m] = start.split(':').map(Number);
       const total = h * 60 + m + dur;
       const nh = Math.floor((total / 60) % 24);
       const nm = total % 60;
       return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}:00`;
     };
     const newEnd = calculateEnd(newStart, durMin);
 
     // 5) armar body
     const url = `http://192.168.9.8:3000/api/citas/${dragged.idCita}`;
     const body = {
       ...dragged,
       hora: newStart,
       horaTermina: newEnd
     };
 
     // 6) enviar PUT
     this.http.put(url, body).subscribe({
       next: () => this.cargarConsultas(),
       error: err => {
         console.error('Error al actualizar tras drag:', err);
         alert('No se pudo mover la cita');
       }
     });
   } */

  // -----------------------------------------------------------------------------------------------------

  /** Helper: devuelve "HH:mm" desde un "HH:mm:ss" */
  extraerHoraModal(horaStr: string): string {
    return horaStr?.substr(0, 5) || '';
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