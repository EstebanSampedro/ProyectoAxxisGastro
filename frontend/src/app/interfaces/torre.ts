export class Torre {
    idTorre: number;
    textTorre: string;
  
    /**
     * Constructor de la clase Torre.
     * @param data - Objeto con los datos de la torre.
     */
    constructor(data: any = {}) {
      this.idTorre = data.idTorre || 0; // Si no se proporciona un ID, se asigna 0 por defecto
      this.textTorre = data.textTorre || ''; // Si no se proporciona un texto, se asigna una cadena vacía
    }
  }