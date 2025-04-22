import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent {
  credentials = {
    user: '',
    password: '',

  };

  role: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    sessionStorage.clear();
    localStorage.clear();
    console.log('Se requiere login.');
  }

  onSubmit(): void {
    if (!this.role) {
      this.errorMessage = 'Por favor, selecciona un tipo de usuario.';
      return;
    }
    console.log('Credenciales:', this.credentials);
    const { user, password } = this.credentials;
    if (this.role === 'admin') {
      this.authService
        .loginAdmin({ user: this.credentials.user, password: this.credentials.password })
        .subscribe({
          next: (res) => {
            console.log('Login de admin exitoso:', res);
            // Redirige según el permiso del administrador
            const userRole = res.user.permiso.toLowerCase();
            if (userRole === 'administrador') {
              this.router.navigate(['/menu']); // Navega al menú principal
            } else if (userRole === 'usuario') {
              this.router.navigate(['/menu']); // Navega al menú principal (puedes ajustar si es necesario)
            } else {
              this.errorMessage = 'Permiso no reconocido para administrador.';
            }
          },
          error: (err: any) => {
            console.error('Error en login admin:', err);
            this.errorMessage = 'Credenciales inválidas para administrador.';
          },
        });
    } else if (this.role === 'doctor') {
      this.authService
        .loginDoctor({ user: this.credentials.user, password: this.credentials.password })
        .subscribe({
          next: (res) => {
            console.log('Login de doctor exitoso:', res);
            sessionStorage.setItem('token', res.token);
            localStorage.setItem('idDoctor', res.user.idDoctor2)
            this.router.navigate(['/userdoc-menu']);
          },
          error: (err) => {
            console.error('Error en login doctor:', err);
            this.errorMessage = 'Credenciales inválidas para doctor.';
          },
        });
    } else {
      this.errorMessage = 'Tipo de usuario no reconocido.';
    }
  }
}
