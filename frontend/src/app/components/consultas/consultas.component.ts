import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.css'],
  standalone: false
})
export class ConsultasComponent implements OnInit {

  // En lugar de strings, aquí guardaremos objetos provenientes de la DB
  doctors: any[] = [];

  constructor(
    private router: Router,
    private apiService: ApiService // Inyectamos nuestro servicio
  ) {}

  ngOnInit(): void {
    this.cargarDoctores();
  }

  // Método para obtener los doctores desde el backend
  cargarDoctores() {
    this.apiService.getDoctores().subscribe(
      (data) => {
        this.doctors = data;
        console.log('Doctores obtenidos:', data);
      },
      (error) => {
        console.error('Error al obtener doctores:', error);
      }
    );
  }

  
  // Al seleccionar un doctor
  selectDoctor(doctor: any) {
    // Supongamos que la tabla doctor2 tiene nomDoctor2, userDoc, etc.
    console.log('Seleccionaste al doctor:', doctor.nomDoctor2);
    this.router.navigate(['/consultas-menu-doc', doctor.idDoctor2]);
    // this.router.navigate(['/consultas-doctor', doctor.idDoctor2]); // Ejemplo
  }
}
