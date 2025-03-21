/**
 * Clase Observacion para estructurar datos
 */
class Observacion {
    /**
     * @param {Object} data - Datos de la observación
     */
    constructor(data) {
      this.idObser = data.idObser;
      this.fechaObser = new Date(data.fechaObser);
      this.textObser = data.textObser;
      this.estado = data.estado;
      this.docObser = data.docObser;
    }
  }
  
  module.exports = Observacion;