/**
 * Clase Cita para estructurar datos
 */
class Cita {
    /**
     * @param {Object} data - Datos de la cita
     */
    constructor(data) {
      this.idDoctor_cita = data.idDoctor_cita;
      this.fecha = new Date(data.fecha);
      this.torre = data.torre;
      this.hora = new Date(`1970-01-01T${data.hora}Z`);
      this.horaTermina = new Date(`1970-01-01T${data.horaTermina}Z`);
      this.paciente = data.paciente;
      this.edad = data.edad;
      this.telefono = data.telefono;
      this.procedimiento = data.procedimiento;
      this.imagen = data.imagen || "";
      this.pedido = data.pedido || "";
      this.institucion = data.institucion || "";
      this.seguro = data.seguro || "";
      this.estado = data.estado;
      this.confirmado = data.confirmado;
      this.observaciones = data.observaciones || "";
      this.observaciones2 = data.observaciones2 || "";
      this.colorCita = data.colorCita;
      this.cedula = data.cedula;
      this.recordatorioEnv = data.recordatorioEnv;
      this.tipoCita = data.tipoCita;
    }
  }
  
  module.exports = Cita;
  