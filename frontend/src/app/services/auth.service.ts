import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import config from '../config/util.json';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl: string = config.api.baseUrl;
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(
      localStorage.getItem('currentUser') ? JSON.parse(sessionStorage.getItem('currentUser')!) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  loginDoctor(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${config.api.endpoints.authDoctor}`, {
      user: credentials.username,
      password: credentials.password
    }).pipe(
      tap(response => {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        sessionStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  loginAdmin(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${config.api.endpoints.authAdmin}`, {
      user: credentials.username,
      password: credentials.password
    }).pipe(
      tap(response => {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        sessionStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  getUsername(): string {
    return this.currentUserValue?.user || 'Invitado';
  }

  getAdminId(): number {
    if (this.currentUserValue && this.currentUserValue.idmedico) {
      return this.currentUserValue.idmedico;
    }
    return 0;
  }

  getDoctorId(): number {
    // Supongamos que en tu objeto usuario se guarda la propiedad idDoctor2
    return this.currentUserValue?.idDoctor2 || 0;
  }  
  
}