// src/app/interfaces/cita.ts

export class Cita {
  // PK y FK principales
  idCita?: number;
  idDoctor_cita: number;

  // IDs crudos de los admins (medico) que crean y confirman
  idResponsable_idMedico?: number;
  idConfirma_idMedico?: number;

  // Datos de la cita
  fecha: Date;
  torre: number;
  hora: string;
  horaTermina: string;
  paciente: string;
  edad: number;
  telefono: string;
  procedimiento: string;
  imagen?: string;
  pedido?: string;
  institucion?: string;
  seguro?: string;
  estado: string;
  confirmado: string;
  observaciones?: string;
  observaciones2?: string;
  colorCita: string;
  cedula: string;
  recordatorioEnv: boolean;
  responsable?: string;
  // Las siglas resueltas de los admins
  responsableCode?: string;
  confirmaCode?: string;

  // Propiedades auxiliares para la UI
  horaStr?: string;      // Formato "HH:mm:00"
  horaFinStr?: string;   // Formato "HH:mm:00"
  modificado?: boolean;  // Marca si está en modo edición

  constructor(data: Partial<Cita> = {}) {
    // IDs
    this.idCita                 = data.idCita;
    this.idDoctor_cita          = data.idDoctor_cita || 0;
    this.idResponsable_idMedico = data.idResponsable_idMedico;
    this.idConfirma_idMedico    = data.idConfirma_idMedico;

    // Cita
    this.fecha       = data.fecha ? new Date(data.fecha) : new Date();
    this.torre       = data.torre    || 0;
    this.hora        = data.hora     || '';
    this.horaTermina = data.horaTermina || '';
    this.paciente    = data.paciente || '';
    this.edad        = data.edad     || 0;
    this.telefono    = data.telefono || '';
    this.procedimiento = data.procedimiento || '';
    this.imagen      = data.imagen   || '';
    this.pedido      = data.pedido   || '';
    this.institucion = data.institucion || '';
    this.seguro      = data.seguro   || '';
    this.estado      = data.estado   || '';
    this.confirmado  = data.confirmado || 'pendiente';
    this.observaciones  = data.observaciones  || '';
    this.observaciones2 = data.observaciones2 || '';
    this.colorCita   = data.colorCita || '#FFFFFF';
    this.cedula      = data.cedula    || '';
    this.recordatorioEnv = data.recordatorioEnv || false;

    // Códigos resueltos (se asignarán luego en el componente)
    this.responsableCode = '';
    this.confirmaCode    = '';

    // Auxiliares vacíos al inicio
    this.horaStr    = '';
    this.horaFinStr = '';
    this.modificado = false;
  }
}
