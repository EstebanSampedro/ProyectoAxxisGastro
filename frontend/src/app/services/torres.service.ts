import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import util from '../config/util.json';
import { Torre } from '../interfaces/torre';



@Injectable({
  providedIn: 'root',
})
export class TorreService {
  private apiUrl = util.api.baseUrl; // URL base de la API
  private endpoints = util.api.endpoints.torres; // Endpoints específicos para torres

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las torres
   */
  getAllTorres(): Observable<Torre[]> {
    return this.http.get<Torre[]>(`${this.apiUrl}${this.endpoints.getAll}`);
  }

  /**
   * Obtener una torre por ID
   */
  getTorreById(id: number): Observable<Torre> {
    return this.http.get<Torre>(`${this.apiUrl}${this.endpoints.getById.replace(':id', id.toString())}`);
  }

  /**
   * Registrar una nueva torre
   */
  registerTorre(torre: Torre): Observable<Torre> {
    return this.http.post<Torre>(`${this.apiUrl}${this.endpoints.register}`, torre);
  }

  /**
   * Actualizar una torre existente
   */
  updateTorre(id: number, torre: Torre): Observable<Torre> {
    return this.http.put<Torre>(`${this.apiUrl}${this.endpoints.update.replace(':id', id.toString())}`, torre);
  }

  /**
   * Eliminar una torre
   */
  deleteTorre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${this.endpoints.delete.replace(':id', id.toString())}`);
  }
}