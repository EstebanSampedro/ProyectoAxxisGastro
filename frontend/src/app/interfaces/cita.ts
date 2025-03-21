export class Cita {
    idCita?: number;
    idDoctor_cita: number;
    fecha: Date;
    torre: string;
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
    confirmado: boolean;
    observaciones?: string;
    observaciones2?: string;
    colorCita: string;
    cedula: string;
    recordatorioEnv: boolean;
  
    constructor(data: Partial<Cita> = {}) {
      this.idCita = data.idCita;
      this.idDoctor_cita = data.idDoctor_cita || 0;
      this.fecha = new Date(data.fecha || new Date());
      this.torre = data.torre || '';
      this.hora = data.hora || '';
      this.horaTermina = data.horaTermina || '';
      this.paciente = data.paciente || '';
      this.edad = data.edad || 0;
      this.telefono = data.telefono || '';
      this.procedimiento = data.procedimiento || '';
      this.imagen = data.imagen || '';
      this.pedido = data.pedido || '';
      this.institucion = data.institucion || '';
      this.seguro = data.seguro || '';
      this.estado = data.estado || '';
      this.confirmado = data.confirmado || false;
      this.observaciones = data.observaciones || '';
      this.observaciones2 = data.observaciones2 || '';
      this.colorCita = data.colorCita || '#FFFFFF';
      this.cedula = data.cedula || '';
      this.recordatorioEnv = data.recordatorioEnv || false;
    }
  }
  