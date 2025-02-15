import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Cambia esta URL por la de tu backend
const BASE_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',  
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getDoctores(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/doctores`);
  }

  // NUEVOS MÉTODOS PARA LOGIN:

  // Para login de Admin
  loginAdmin(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/api/auth/admin/login`, credentials);
  }

  // Para login de Doctores
  loginDoctor(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/api/auth/doctor/login`, credentials);
  }
}
