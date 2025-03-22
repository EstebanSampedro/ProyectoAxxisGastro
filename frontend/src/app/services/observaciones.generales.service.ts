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
  filterObservaciones(doctorId: number, fecha: Date): Observable<Observacion[]> {
    // Formatear la fecha a YYYY-MM-DD
    const fechaFormateada = this.formatDate(fecha);
    console.log("fechaFormateada", fechaFormateada);
    return this.http.get<Observacion[]>(
      `${this.apiUrl}${this.endpoints.filter}?doctorId=${doctorId}&fecha=${fechaFormateada}`
    );
  }

   /**
   * Formatear fecha a YYYY-MM-DD
   */
   private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Añade un 0 al principio si es necesario
    const day = ('0' + date.getDate()).slice(-2); // Añade un 0 al principio si es necesario
    return `${year}-${month}-${day}`;
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