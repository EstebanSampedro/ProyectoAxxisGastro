import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-config-doctor',
  templateUrl: './config-doctor.component.html',
  styleUrls: ['./config-doctor.component.css'],
  standalone: false
})
export class ConfigDoctorComponent implements OnInit {
  doctors: any[] = [];
  selectedDoctor: any = null;
  doctorForm: any = {};

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.http.get<any[]>('http://localhost:3000/api/doctores').subscribe({
      next: (data) => {
        this.doctors = data;
      },
      error: (err) => {
        console.error('Error al cargar doctores:', err);
      }
    });
  }

  selectDoctor(doc: any): void {
    this.selectedDoctor = doc;
    this.doctorForm = { ...doc };
  }

  newDoctor(): void {
    this.selectedDoctor = null;
    this.doctorForm = {};
  }

  createDoctor(): void {
    this.http.post('http://localhost:3000/api/doctores', this.doctorForm).subscribe({
      next: (resp) => {
        console.log('Doctor creado:', resp);
        this.loadDoctors();
        this.doctorForm = {};
      },
      error: (err) => {
        console.error('Error al crear doctor:', err);
      }
    });
  }

  updateDoctor(): void {
    const url = `http://localhost:3000/api/doctores/${this.selectedDoctor.idDoctor2}`;
    this.http.put(url, this.doctorForm).subscribe({
      next: (resp) => {
        console.log('Doctor actualizado:', resp);
        this.loadDoctors();
      },
      error: (err) => {
        console.error('Error al actualizar doctor:', err);
      }
    });
  }

  deleteDoctor(): void {
    if (!confirm('¿Está seguro de eliminar este doctor?')) return;
    const url = `http://localhost:3000/api/doctores/${this.selectedDoctor.idDoctor2}`;
    this.http.delete(url).subscribe({
      next: (resp) => {
        console.log('Doctor eliminado:', resp);
        this.loadDoctors();
        this.selectedDoctor = null;
        this.doctorForm = {};
      },
      error: (err) => {
        console.error('Error al eliminar doctor:', err);
      }
    });
  }
}
