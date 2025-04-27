import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import config from '../config/util.json';

export interface Admin {
  idmedico: number;
  nombre: string;
  permiso: string;
  codigoMedico: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl: string = config.api.baseUrl;
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  /** Caché local de administradores (tabla medico) */
  public admins: Admin[] = [];

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem('token');
    const user = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;
    this.currentUserSubject = new BehaviorSubject<any>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }


  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  private cleanSession(): void {
    sessionStorage.clear();
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.admins = []; // Limpia la caché de administradores
  }

  /**
   * Login para administradores
   */
  loginAdmin(credentials: { user: string; password: string }): Observable<any> {
    this.cleanSession();
    const endpoint = config.api.endpoints.authAdmin;

    // Validación del endpoint
    if (!endpoint) {
      throw new Error('Endpoint para administradores no configurado en config.');
    }

    return this.http.post<any>(`${this.baseUrl}${endpoint}`, credentials).pipe(
      tap((response) => {
        // Procesa la respuesta del backend
        const user = {
          ...response.user,
        };
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError((error) => {
        console.error('Error en login admin:', error);
        return throwError(() => new Error('Error al iniciar sesión. Verifica tus credenciales.'));
      })
    );
  }
  /**
   * Login para doctores
   */
  loginDoctor(credentials: { user: string; password: string }): Observable<any> {
    this.cleanSession();
    const endpoint = config.api.endpoints.authDoctor;
    if (!endpoint) {
      throw new Error('Endpoint para doctores no configurado en config.');
    }
    return this.http.post<any>(`${this.baseUrl}${endpoint}`, credentials).pipe(
      tap((response) => {
        const user = {
          ...response.user,
          permiso: 'doctor', // Asigna el rol fijo como "doctor"
        };
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    this.cleanSession();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  hasRole(role: string): boolean {
    const userRole = this.currentUserValue?.role?.toLowerCase();
    return userRole === role.toLowerCase();
  }

  getUsername(): string {
    return this.currentUserValue?.nombre || this.currentUserValue?.nomDoctor2 || 'Invitado';
  }

  getAdminId(): number {
    return this.currentUserValue?.id || 0;
  }

  getDoctorId(): number {
    return this.currentUserValue?.idDoctor2 || 0;
  }

  fetchAllAdmins(): Observable<Admin[]> {
    return this.http
      .get<Admin[]>(`${this.baseUrl}/auth/usuarios`)
      .pipe(tap((list) => (this.admins = list)));
  }

  /**
   * Devuelve las siglas (codigoMedico) del admin con ese id,
   * o cadena vacía si no existe o no viene.
   */
  getAdminCode(id?: number): string {
    if (id == null) return '';
    const found = this.admins.find((a) => a.idmedico === id);
    return found ? found.codigoMedico : '';
  }

  /**
 * Devuelve las siglas (codigoMedico) del admin con ese id,
 * o cadena vacía si no existe o no viene.
 */
  getCurrentAdminCode(): string {
    return this.currentUserValue.codigoMedico || 'N/A';
  }
}