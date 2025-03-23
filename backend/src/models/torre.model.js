// models/torre.model.js

/**
 * Clase Torre para estructurar datos
 */
class Torre {
    /**
     * @param {Object} data - Datos de la torre
     */
    constructor(data) {
      this.idTorre = data.idTorre;
      this.textTorre = data.textTorre;
    }
  }
  
  module.exports = Torre;