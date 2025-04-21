import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Observacion } from '../interfaces/observacion.general'; // Asegúrate de que la ruta sea correcta
import util from '../config/util.json';

@Injectable({
  providedIn: 'root',
})
export class ObservacionService {
  private apiUrl = util.api.baseUrl;
  private endpoints = util.api.endpoints.observaciones;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las observaciones
   */
  getObservaciones(): Observable<Observacion[]> {
    return this.http.get<Observacion[]>(`${this.apiUrl}${this.endpoints.getAll}`);
  }

  /**
   * Registrar una nueva observación
   */
  registerObservacion(observacion: Observacion): Observable<Observacion> {
    return this.http.post<Observacion>(`${this.apiUrl}${this.endpoints.register}`, observacion);
  }

  /**
     * Filtrar observaciones por doctor y fecha
     */
  filterObservaciones(
    doctorId: number,
    fecha: string | Date
  ): Observable<Observacion[]> {
    // si es Date, lo convertimos a 'YYYY-MM-DD', si ya es string lo usamos tal cual
    const fechaStr =
      typeof fecha === 'string'
        ? fecha
        : this.formatDate(fecha);
    return this.http.get<Observacion[]>(
      `${this.apiUrl}${this.endpoints.filter}`,
      {
        params: {
          doctorId: doctorId.toString(),
          fecha:    fechaStr
        }
      }
    );
  }


  
  /**
   * Filtrar observaciones por fecha
   */
  filterObservacionesByDate(fecha: Date | string): Observable<Observacion[]> {
    // si te pasan un Date, lo formateas; si te pasan un string, lo usas tal cual
    const fechaStr =
      typeof fecha === 'string'
        ? fecha
        : this.formatDate(fecha);

    return this.http.get<Observacion[]>(
      `${this.apiUrl}${this.endpoints.byDate}?fecha=${fechaStr}`
    );
  }
  

   /**
   * Formatear fecha a YYYY-MM-DD
   */
   private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

  /**
   * Actualizar una observación
   */
  updateObservacion(id: number, observacion: Observacion): Observable<Observacion> {
    return this.http.put<Observacion>(`${this.apiUrl}${this.endpoints.update.replace(':id', id.toString())}`, observacion);
  }

  /**
   * Eliminar una observación
   */
  deleteObservacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${this.endpoints.delete.replace(':id', id.toString())}`);
  }
}