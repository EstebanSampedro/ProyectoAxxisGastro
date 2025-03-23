import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from '../interfaces/cita';
import util from '../config/util.json';

@Injectable({
  providedIn: 'root',
})
export class CitaService {
  private apiUrl = util.api.baseUrl;
  private endpoints = util.api.endpoints.citas;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las citas
   */
  getCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}${this.endpoints.getAll}`);
  }

  /**
   * Filtrar citas por doctor y fecha
   */
  getCitasByDoctorAndDate(doctorId: number, fecha: string): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}${this.endpoints.filter}?doctorId=${doctorId}&fecha=${fecha}`);
  }


  /**
 * Filtrar citas por doctor y fecha
 */
  getCitasByDate( fecha: string): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}${this.endpoints.filterByDate}?fecha=${fecha}`);
  }

  /**
   * Filtrar citas por fecha y torre
   */
  getCitasByDateAndTower(fecha: string, torre: number): Observable<Cita[]> {
    return this.http.get<Cita[]>(
      `${this.apiUrl}${this.endpoints.filterByDateAndTower}?fecha=${fecha}&torre=${torre}`
    );
  }
  /**
   * Registrar una nueva cita
   */
  registerCita(cita: Cita): Observable<any> {
    return this.http.post(`${this.apiUrl}${this.endpoints.register}`, cita);
  }

  /**
   * Editar una cita
   */
  updateCita(id: number, cita: Cita): Observable<any> {
    return this.http.put(`${this.apiUrl}${this.endpoints.update}/${id}`, cita);
  }

  /**
   * Eliminar una cita
   */
  deleteCita(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${this.endpoints.delete}/${id}`);
  }
}
