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
import { EMPTY, forkJoin, of } from 'rxjs';

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

  startHour = 7;  // hora de inicio
  endHour = 21; // hora de fin

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
    '#808080': 'Gris'
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
  private crearLog(citaId: number, tipo: 'edicion' | 'eliminacion'): Observable<any> {
    const body = {
      cita_idCita: citaId,
      tipoCambio: tipo,
      medico_idMedico: this.authService.getAdminId()
    };
    return this.http.post('http://localhost:3000/api/citas/logs', body).pipe(
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
    this.http.get<any[]>(`http://localhost:3000/api/observaciones/filter`, {
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
    this.consultas = [];
    this.slotViews = [];

    const fechaStr = this.selectedDate;               // "YYYY-MM-DD"
    const doctorId = parseInt(this.idDoctor, 10);
    // NOTA: ya no usamos this.selectedTorreId aquí, para traer todas las torres

    forkJoin({
      citas: this.citaService.getCitasActivas(fechaStr, doctorId),
      consultas: this.citaService.getConsultasActivas(fechaStr, doctorId)
    }).pipe(
      map(({ citas, consultas }) => {
        const mapSlot = (c: any) => {
          const horaStr = this.extraerHora(c.hora);
          const horaFinStr = this.extraerHora(c.horaTermina);
          // 👉 Aquí obtenemos el código (iniciales) del admin que creó el registro:
          const responsable = c.idResponsable_idMedico
            ? this.authService.getAdminCode(c.idResponsable_idMedico)
            : '';

          return {
            ...c,
            horaStr,
            horaFinStr,
            responsable
          };
        };

        // 1) Mapear todas las citas regulares (tipo “cita”)
        const citasNorm = citas.normal.map(mapSlot);

        // 2) Filtrar consultas (tipo “consulta”) que no empalmen con ninguna cita
        const citaHoras = new Set(citasNorm.map(c => c.horaStr));
        const consultasNorm = consultas.normal
          .map(mapSlot)
          .filter(c => !citaHoras.has(c.horaStr));

        // 3) Unir ambas colecciones en un solo arreglo “normales”
        const normales = [...citasNorm, ...consultasNorm];

        // 4) Hacer lo mismo para los registros con “error” en confirmado
        const citasErr = citas.errors.map(mapSlot);
        const errHoras = new Set(citasErr.map(c => c.horaStr));
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
    this.timeSlots = [];
    for (let h = this.startHour; h <= this.endHour; h++) {
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

  /**
   * Reconstruye `slotViews` incluyendo:
   * - Todas las citas, colocándolas en su hora exacta de inicio.
   * - Huecos `empty` y `custom-empty` para todo el resto del día,
   *   usando el tamaño de slot definido en `slotDurationMin`.
   */
  private buildSlotViews(): void {
    const slotMin = this.slotDurationMin;          // duración de cada subslot en minutos
    const sorted = [...this.consultas]
      .sort((a, b) => this.timeToMinutes(a.horaStr) - this.timeToMinutes(b.horaStr));

    this.slotViews = [];

    // determinar inicio y fin del día en minutos
    const startDayMin = this.startHour * 60;       // ej. 7h → 420
    const endDayMin = (this.endHour + 1) * 60;   // ej. 21h → (22*60)=1320

    let cursor = startDayMin;  // "cursor" recorre todo el día en minutos

    for (let cita of sorted) {
      const citaStart = this.timeToMinutes(cita.horaStr);
      const citaEnd = this.timeToMinutes(cita.horaFinStr);

      // 1) Rellenar huecos libres antes de esta cita
      while (cursor < citaStart) {
        const slotTime = this.minutesToTimeStr(cursor);
        this.slotViews.push({ slot: slotTime, type: 'empty' });
        this.slotViews.push({ slot: slotTime, type: 'custom-empty' });
        cursor += slotMin;
      }

      // 2) Insertar la cita en su hora exacta
      const citaConColor = {
        ...cita,
        colorCita: cita.tipoCita === 'cita'
          ? '#FF3F38'
          : (cita.colorCita || '#FFFFFF')
      };
      this.slotViews.push({
        slot: cita.horaStr,
        type: 'appointment',
        cita: citaConColor
      });

      // 3) Avanzar el cursor hasta el final de esta cita
      cursor = Math.max(cursor, citaEnd);
    }

    // 4) Rellenar huecos libres **después** de la última cita
    while (cursor < endDayMin) {
      const slotTime = this.minutesToTimeStr(cursor);
      this.slotViews.push({ slot: slotTime, type: 'empty' });
      this.slotViews.push({ slot: slotTime, type: 'custom-empty' });
      cursor += slotMin;
    }
  }


  /** 
 * Convierte un número de minutos desde medianoche a "HH:mm:ss" 
 */
  private minutesToTimeStr(totalMin: number): string {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return `${hh}:${mm}:00`;
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
            return !(endMin <= exStart || startMin >= exEnd);
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
          paciente: this.newCitaData.paciente || 'Paciente Indeterminado',
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
          observaciones2: this.newCitaData.observaciones2 || '',
          colorCita: overlap ? '#ffff00' : (this.newCitaData.colorCita || 'amarillo-opaco'),
          cedula: this.newCitaData.cedula || '',
          recordatorioEnv: false,
          tipoCita: 'consulta'
        };

        // 6) POST para registrar la cita
        return this.http.post<{ idCita: number }>(
          'http://localhost:3000/api/citas/register',
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
      .patch(`http://localhost:3000/api/citas/${id}/eliminar`, { medico_idMedico: this.authService.getAdminId() })
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

    // 4) Validar solapamiento
    const fecha = this.selectedDate;           // "YYYY-MM-DD"
    const torre = this.selectedTorreId;        // número

    this.hasOverlap(fecha, torre, id, hora, horaTermina)
      .pipe(
        switchMap(overlap => {
          if (overlap) {
            alert('❌ Este rango solapa con otra cita/consulta.');
            return EMPTY;   // nada más hacer
          }

          // 5) Armar el body y enviar PUT
          const url = `http://localhost:3000/api/citas/${id}`;
          const adminId = this.authService.getAdminId();
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

          return this.http.put(url, body).pipe(
            switchMap(() => this.crearLog(id, 'edicion'))
          );
        })
      )
      .subscribe({
        next: () => {
          this.editingCitaId = null;
          this.newCitaData = {};
          this.cargarConsultas();
        },
        error: err => {
          console.error('Error editando la cita:', err);
          alert('Error guardando cambios');
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


  /**
   * Consulta al backend las citas/consultas de una fecha+torre,
   * y retorna un Observable<boolean> indicando si el rango [newStart, newEnd]
   * solapa con alguna existente (excluyendo excludeId).
   *
   * @param fecha       "YYYY-MM-DD"
   * @param torre       número de torre
   * @param excludeId   idCita a excluir de la comprobación (la que estamos editando)
   * @param newStart    "HH:mm:ss"
   * @param newEnd      "HH:mm:ss"
   */
  private hasOverlap(
    fecha: string,
    torre: number,
    excludeId: number,
    newStart: string,
    newEnd: string
  ): Observable<boolean> {
    const toMin = (s: string) => {
      const [H, M] = s.split(':').map(Number);
      return H * 60 + M;
    };
    const newStartMin = toMin(newStart);
    const newEndMin = toMin(newEnd);

    return this.citaService.getCitasByDateAndTower(fecha, torre).pipe(
      map(all => all
        .filter(c => c.idCita !== excludeId)
        .some(c => {
          // extraer y normalizar a "HH:mm:ss"
          const existStart = this.getHoraString(this.extraerHora(c.hora));
          const existEnd = this.getHoraString(this.extraerHora(c.horaTermina));
          const existStartMin = toMin(existStart);
          const existEndMin = toMin(existEnd);
          return newStartMin < existEndMin && newEndMin > existStartMin;
        })
      )
    );
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
  // 1) Número en E.164
  let phone = cita.telefono.trim();
  if (phone.startsWith('0')) phone = phone.substring(1);
  if (!phone.startsWith('+')) phone = '+593' + phone;

  // 2) Solo para tipo "consulta"
  if ((cita.tipoCita || '').toLowerCase() !== 'consulta') {
    alert('Este botón es sólo para recordatorio de CONSULTA.');
    return;
  }

  // 3) Variables de plantilla
  const parsed = parse(this.selectedDate, 'yyyy-MM-dd', new Date());
  const fecha   = format(parsed, "EEEE dd 'de' MMMM 'del' yyyy", { locale: es });
  const hora    = cita.horaStr;
  const paciente = cita.paciente;
  const doctor   = this.doctorName;

  // 4) Llamada al nuevo endpoint
  this.http.post<any>(
    'http://localhost:3000/api/whatsapp/consulta/recordatorio',
    {
      phone,      // '+5939XXXXXXX'
      paciente,   // {{1}}
      doctor,      // {{2}}
      fecha,       // {{3}}
      hora      // {{4}}
    }
  ).subscribe({
    next: resp => {
      console.log('Plantilla consulta/recordatorio enviada:', resp);
      alert('Recordatorio de consulta enviado por WhatsApp 👍');
    },
    error: err => {
      console.error('Error al enviar recordatorio de consulta:', err);
      alert('No se pudo enviar el recordatorio de consulta');
    }
  });
}



  enviarRecordatorio(cita: any): void {
  // 1) evita reenvíos
  if (cita.recordatorioEnv) {
    alert('El recordatorio ya fue enviado.');
    return;
  }
  if (!confirm(`¿Está seguro de enviar el recordatorio al paciente "${cita.paciente}"?`)) {
    return;
  }

  // 2) formatea teléfono a E.164
  let phone = cita.telefono.trim();
  if (phone.startsWith('0')) phone = phone.substring(1);
  if (!phone.startsWith('+')) phone = '+593' + phone;

  // 3) solo para CONSULTA
  if ((cita.tipoCita || '').toLowerCase() !== 'consulta') {
    alert('Este botón es solo para recordatorio de CONSULTA.');
    return;
  }

  // 4) prepara vars de plantilla
  const fechaObj = new Date(this.selectedDate);
  fechaObj.setDate(fechaObj.getDate() + 1);
  const fecha = format(fechaObj, "EEEE dd 'de' MMMM 'del' yyyy", { locale: es });
  const hora    = cita.horaStr;
  const paciente= cita.paciente;
  const doctor  = this.doctorName

  // 5) invoca tu endpoint de plantilla2
  this.http.post<any>(
    'http://localhost:3000/api/whatsapp/consulta/seguimiento',
    { phone, paciente, fecha, hora, doctor }
  ).subscribe({
    next: resp => {
      console.log('Seguimiento consulta enviado:', resp);
      alert('Recordatorio de consulta enviado por WhatsApp 👍');

      // 6) marca recordatorioEnv = true
      const updateBody = { ...cita, recordatorioEnv: true };
      this.http.put(`http://localhost:3000/api/citas/${cita.idCita}`, updateBody)
        .subscribe({
          next: () => this.cargarConsultas(),
          error: err => console.error('Error actualizando cita:', err)
        });
    },
    error: err => {
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
    const fechaRaw = this.rescheduleDate;
    const torre = this.rescheduleTorre;
    let startRaw = this.rescheduleHour;
    let endRaw = this.rescheduleEndHour;

    // 2) Validaciones básicas
    if (!fechaRaw || !startRaw || !endRaw) {
      return alert('Por favor, completa todos los campos (fecha, hora inicio, hora fin y torre).');
    }

    // 3) Normalizar formatos
    const fecha = this.getFechaString(fechaRaw);      // "YYYY-MM-DD"
    const horaStr = this.getHoraString(startRaw);       // "HH:mm:ss"
    const horaTermStr = this.getHoraString(endRaw);         // "HH:mm:ss"

    // 4) Validar orden
    const toMin = (s: string) => {
      const [H, M] = s.split(':').map(Number);
      return H * 60 + M;
    };
    if (toMin(horaTermStr) <= toMin(horaStr)) {
      return alert('La hora fin debe ser posterior a la hora inicio.');
    }

    // 5) Validar solapamiento con método compartido
    this.hasOverlap(fecha, torre, cita.idCita, horaStr, horaTermStr).pipe(
      switchMap(overlap => {
        if (overlap) {
          alert('❌ Este rango de horas solapa con otra cita/consulta en la misma torre.');
          return EMPTY;
        }

        // 6) Si no hay overlap, enviamos PATCH
        const url = `http://localhost:3000/api/citas/${cita.idCita}/reagendar`;
        const body = { fecha, torre, hora: horaStr, horaTermina: horaTermStr };

        return this.http.patch(url, body).pipe(
          tap(() => {
            alert('✅ Cita reagendada correctamente');
            this.closeRescheduleModal();
            this.editingCitaId = null;
            this.editingSlot = null;
            this.cargarConsultas();
          })
        );
      })
    ).subscribe({
      error: err => {
        console.error('Error en reagendamiento:', err);
        alert('No se pudo reagendar la cita. Inténtalo nuevamente.');
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
     const url = `http://localhost:3000/api/citas/${dragged.idCita}`;
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