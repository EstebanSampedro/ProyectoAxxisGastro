import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from '../interfaces/cita';
import util from '../config/util.json';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CitaService {
  private apiUrl = util.api.baseUrl;
  //private endpoints = util.api.endpoints.citas;
  private base = environment.api.baseUrl;
  private endpoints = environment.api.endpoints.citas;
  constructor(private http: HttpClient) { }

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
  getCitasByDate(fecha: string): Observable<Cita[]> {
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

  getConsultasByDateAndTower(fecha: string, torre: number, doctorId: number): Observable<any> {
    const url = `${this.base}${this.endpoints.getConsultas}`;
    const params = new HttpParams()
      .set('fecha', fecha)
      .set('torre', torre.toString())
      .set('doctorId', doctorId.toString());

    return this.http.get<{ normal: any[]; errors: any[] }>(url, { params });
  }

  getConsultasActivas(fecha: string, doctorId: number, torre?: number): Observable<{ normal: any[]; errors: any[] }> {
    const url = `${environment.api.baseUrl}${environment.api.endpoints.citas.getConsultasActive}`;
    let params = new HttpParams()
      .set('fecha', fecha)
      .set('doctorId', doctorId.toString());

    if (torre != null) {
      params = params.set('torre', torre.toString());
    }

    return this.http.get<{ normal: any[]; errors: any[] }>(url, { params });
  }

  getCitasActivas(fecha: string, doctorId: number, torre?: number): Observable<{ normal: any[]; errors: any[] }> {
    const url = `${environment.api.baseUrl}${environment.api.endpoints.citas.getCitasActive}`;
    let params = new HttpParams()
      .set('fecha', fecha)
      .set('doctorId', doctorId.toString());

    if (torre != null) {
      params = params.set('torre', torre.toString());
    }

    return this.http.get<{ normal: any[]; errors: any[] }>(url, { params });
  }

}
