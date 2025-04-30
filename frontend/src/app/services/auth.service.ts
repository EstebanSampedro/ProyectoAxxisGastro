import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map, switchMap, take } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Admin } from '../interfaces/admin';
import { LoginCredentials } from '../interfaces/login.credentials';
import { AuthResponse } from '../interfaces/auth.response';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly jwtHelper = inject(JwtHelperService);

  private readonly tokenKey = 'token';
  private readonly refreshTokenKey = 'auth_refresh_token';
  private readonly userKey = 'user';
  private readonly tokenRefreshInProgress$ = new BehaviorSubject<boolean>(false);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  public admins: Admin[] = [];

  constructor() {
    this.initializeAuthState();
  }

  /**
   * Inicializa el estado de autenticación al cargar el servicio
   */
  private initializeAuthState(): void {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(user);
    } else {
      this.clearSession();
    }
  }

  /**
   * Login para administradores
   */
  loginAdmin(credentials: LoginCredentials): Observable<User> {
    return this.authenticate(credentials, 'admin');
  }

  /**
   * Login para doctores
   */
  loginDoctor(credentials: LoginCredentials): Observable<User> {
    return this.authenticate(credentials, 'doctor');
  }

  private authenticate(credentials: LoginCredentials, userType: 'admin' | 'doctor'): Observable<User> {
    this.clearSession();

    const endpoint = userType === 'admin' ?
      environment.api.endpoints.authAdmin :
      environment.api.endpoints.authDoctor;

    if (!endpoint) {
      return throwError(() => new Error(`Endpoint para ${userType} no configurado`));
    }

    return this.http.post<AuthResponse>(`${environment.api.baseUrl}${endpoint}`, credentials).pipe(
      tap((response) => this.setSession(response, userType)),
      map(response => response.user),
      catchError(error => {
        console.error(`Error en login ${userType}:`, error);
        return throwError(() => this.handleLoginError(error));
      })
    );
  }

  private setSession(authResponse: AuthResponse, userType: string): void {
    const user = {
      ...authResponse.user,
      permiso: userType === 'doctor' ? 'doctor' : authResponse.user.permiso
    };

    localStorage.setItem(this.tokenKey, authResponse.token);
    if (authResponse.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, authResponse.refreshToken);
    }
    localStorage.setItem(this.userKey, JSON.stringify(user));

    this.currentUserSubject.next(user);
  }

  logout(redirect: boolean = true): void {
    this.clearSession();
    if (redirect) {
      this.router.navigate(['/login'], {
        queryParams: { logout: true }
      });
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.clear();
    this.currentUserSubject.next(null);
    this.admins = [];
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) : null;
  }

  isTokenExpired(token: string): boolean {
    return this.jwtHelper.isTokenExpired(token);
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string | string[]): boolean {
    const userRole = this.currentUserValue?.permiso?.toLowerCase();
    if (!userRole) return false;

    if (Array.isArray(role)) {
      return role.some(r => r.toLowerCase() === userRole);
    }
    return userRole === role.toLowerCase();
  }

  getUsername(): string {
    return this.currentUserValue?.nombre ||
      this.currentUserValue?.nomDoctor2 ||
      'Invitado';
  }

  getAdminId(): number {
    return this.currentUserValue?.id || 0;
  }

  getDoctorId(): number {
    return this.currentUserValue?.idDoctor2 || 0;
  }

  fetchAllAdmins(): Observable<Admin[]> {
    return this.http.get<Admin[]>(`${environment.api.baseUrl}/auth/usuarios`).pipe(
      tap(admins => this.admins = admins),
      catchError(error => {
        console.error('Error fetching admins:', error);
        return of([]);
      })
    );
  }

  getAdminCode(id?: number): string {
    if (id == null) return '';
    const found = this.admins.find(a => a.idmedico === id);
    return found?.codigoMedico || '';
  }

  getCurrentAdminCode(): string {
    return this.currentUserValue?.codigoMedico || 'N/A';
  }


  private handleLoginError(error: any): Error {
    if (error.status === 401) {
      return new Error('Credenciales inválidas');
    }
    if (error.status === 0) {
      return new Error('No se puede conectar al servidor');
    }
    return new Error('Error al iniciar sesión. Intente nuevamente.');
  }
}