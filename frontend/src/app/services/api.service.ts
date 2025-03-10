import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import  config from '../config/util.json';

@Injectable({
  providedIn: 'root',  
})
export class ApiService {
  constructor(private http: HttpClient) {}
  private baseUrl: string = config.api.baseUrl;
  private currentInterface = new BehaviorSubject<string>('registro-citas'); // Valor inicial
 // Observable para que otros componentes puedan suscribirse
 currentInterface$ = this.currentInterface.asObservable();

 // Método para cambiar la interfaz
 setCurrentInterface(interfaceName: string) {
   this.currentInterface.next(interfaceName);
 }
  getDoctores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${config.api.endpoints.doctores}`);
  }
}
