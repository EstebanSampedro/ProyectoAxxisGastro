import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Incluimos el campo "role" para saber qué login usar
  credentials = {
    username: '',
    password: '',
    role: '' // 'admin' o 'doctor'
  };

  errorMessage: string = '';

  constructor(private apiService: ApiService, private router: Router) {}

  onSubmit(): void {
    if (!this.credentials.role) {
      this.errorMessage = 'Por favor, selecciona un tipo de usuario.';
      return;
    }

    if (this.credentials.role === 'admin') {
      this.apiService.loginAdmin({
        username: this.credentials.username,
        password: this.credentials.password
      }).subscribe({
        next: (res) => {
          console.log('Login de admin exitoso:', res);
          // Guarda el token de forma segura, por ejemplo en localStorage
          localStorage.setItem('token', res.token);
          // Navega a la ruta protegida para administradores
          this.router.navigate(['/admin/dashboard']);
        },
        error: (err) => {
          console.error('Error en login admin:', err);
          this.errorMessage = 'Credenciales inválidas para administrador.';
        }
      });
    } else if (this.credentials.role === 'doctor') {
      this.apiService.loginDoctor({
        username: this.credentials.username,
        password: this.credentials.password
      }).subscribe({
        next: (res) => {
          console.log('Login de doctor exitoso:', res);
          localStorage.setItem('token', res.token);
          // Navega a la ruta protegida para doctores
          this.router.navigate(['/doctor/dashboard']);
        },
        error: (err) => {
          console.error('Error en login doctor:', err);
          this.errorMessage = 'Credenciales inválidas para doctor.';
        }
      });
    } else {
      this.errorMessage = 'Tipo de usuario no reconocido.';
    }
  }
}
