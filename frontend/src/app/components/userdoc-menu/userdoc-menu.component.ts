import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service'; 
import { Cita } from '../../interfaces/cita';

@Component({
  selector: 'app-userdoc-menu',
  templateUrl: './userdoc-menu.component.html',
  styleUrls: ['./userdoc-menu.component.css'],
  standalone: false
})
// userdoc-menu.component.ts
export class UserdocMenuComponent implements OnInit {
    idDoctor2!: number;  
    doctorName: string = '';
    selectedDate: string = '';
    formattedDate: string = '';
    agenda: Cita[] = [];  // Renombrado de 'citas' a 'agenda'
    
    constructor(
      private route: ActivatedRoute,
      private router: Router,
      private http: HttpClient,
      private authService: AuthService
    ) {}
  
    ngOnInit(): void {
      this.idDoctor2 = this.authService.getDoctorId(); 
      const hoy = new Date();
      this.selectedDate = hoy.toISOString().split('T')[0];
      this.formattedDate = format(parseISO(this.selectedDate), "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
      
      this.cargarNombreDoctor();
      this.cargarAgenda();  // Renombrado
    }
  
    cargarNombreDoctor(): void {
      const url = `http://192.168.9.8:3000/api/doctores/${this.idDoctor2}`;
      this.http.get<any>(url).subscribe({
        next: data => {
          this.doctorName = data.nomDoctor2 || 'Dr. sin nombre';
        },
        error: err => {
          console.error('Error al obtener nombre del doctor:', err);
          this.doctorName = 'Dr. sin nombre';
        }
      });
    }
  
    cargarAgenda(): void {  // Renombrado de cargarConsultas a cargarAgenda
      const url = `http://192.168.9.8:3000/api/citas/filter?doctorId=${this.idDoctor2}&fecha=${this.selectedDate}`;
      this.http.get<any[]>(url).subscribe({
        next: data => {
          this.agenda = data.map(cita => {
            const horaStr = this.extraerHora(cita.hora);
            const horaFinStr = this.extraerHora(cita.horaTermina);
            return { 
              ...cita, 
              horaStr, 
              horaFinStr 
            };
          });
          console.log('Agenda del doctor:', this.agenda);
        },
        error: err => {
          console.error('Error al obtener la agenda:', err);
        }
      });
    }
  
    extraerHora(fechaString: string): string {
      if (!fechaString) return '';
      const match = fechaString.match(/T(\d{2}:\d{2}):/);
      return match ? `${match[1]}:00` : '';
    }
  
    onDateChange(): void {
      this.formattedDate = format(parseISO(this.selectedDate), "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
      this.cargarAgenda();
    }
  
    cerrarSesion(): void {
      this.authService.logout();
    }
    
  }
  