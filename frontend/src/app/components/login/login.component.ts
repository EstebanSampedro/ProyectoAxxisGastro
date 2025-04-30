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
  private errorTimeout: any;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    sessionStorage.clear();
    localStorage.clear();
  }

  onSubmit(): void {
    // Limpiar mensajes anteriores
    this.clearErrorMessage();

    if (!this.role) {
      this.showErrorMessage('Por favor, selecciona un tipo de usuario.');
      return;
    }

    console.log('Credenciales:', this.credentials);

    if (this.role === 'admin') {
      this.authService.loginAdmin(this.credentials).subscribe({
        next: (res) => {
          console.log('Login de admin exitoso:', res);
          const userRole = res.permiso.toLowerCase();
          if (userRole === 'administrador' || userRole === 'usuario') {
            this.router.navigate(['/menu']);
          } else {
            this.showErrorMessage('Permiso no reconocido para administrador.');
          }
        },
        error: (err: any) => {
          console.error('Error en login admin:', err);
          this.showErrorMessage('Credenciales inválidas para administrador.');
        },
      });
    } else if (this.role === 'doctor') {
      this.authService.loginDoctor({
        user: this.credentials.user,
        password: this.credentials.password
      }).subscribe({
        next: (res) => {
          console.log('Login de doctor exitoso:', res);
          this.router.navigate(['/userdoc-menu']);
        },
        error: (err) => {
          console.error('Error en login doctor:', err);
          this.showErrorMessage('Credenciales inválidas para doctor.');
        },
      });
    } else {
      this.showErrorMessage('Tipo de usuario no reconocido.');
    }
  }

  private showErrorMessage(message: string): void {
    this.clearErrorMessage();
    this.errorMessage = message;
    this.errorTimeout = setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  private clearErrorMessage(): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.clearErrorMessage();
  }
}
