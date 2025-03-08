import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import  config from '../config/util.json';

@Injectable({
  providedIn: 'root',  
})
export class ApiService {
  constructor(private http: HttpClient) {}
  private baseUrl: string = config.api.baseUrl;

  getDoctores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${config.api.endpoints.doctores}`);
  }
}
