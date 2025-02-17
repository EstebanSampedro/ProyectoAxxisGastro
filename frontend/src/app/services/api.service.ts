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

  // Para login de Admin (nota: se removió '/login')
  loginAdmin(credentials: { username: string; password: string }): Observable<any> {
    // Mapea 'username' a 'user' para que coincida con lo que espera el backend
    const payload = {
      user: credentials.username,
      password: credentials.password,
    };
    return this.http.post<any>(`${BASE_URL}/api/auth/admin`, payload);
  }

  // Para login de Doctores (nota: se removió '/login')
  loginDoctor(credentials: { username: string; password: string }): Observable<any> {
    // Mapea 'username' a 'user'
    const payload = {
      user: credentials.username,
      password: credentials.password,
    };
    return this.http.post<any>(`${BASE_URL}/api/auth/doctor`, payload);
  }
}
