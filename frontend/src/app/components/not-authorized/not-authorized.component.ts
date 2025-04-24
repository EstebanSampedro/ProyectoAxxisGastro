import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-authorized',
  standalone: false,
  template: `
    <div class="not-authorized">
      <h1>Acceso Denegado</h1>
      <p>No tienes permiso para acceder a esta página.</p>
      <button (click)="navigateLogin()" class="btn btn-primary">Iniciar Sesión de nuevo</button>
    </div>
  `,
  styles: [
    `
      .not-authorized {
        text-align: center;
        margin-top: 100px;
      }
      .not-authorized h1 {
        font-size: 2.5rem;
        color: #dc3545;
      }
      .not-authorized p {
        font-size: 1.2rem;
        margin: 20px 0;
      }
      .not-authorized .btn {
        margin-top: 20px;
      }
      /* Botón de envío en amarillo con hover */
      button {
        width: 100%;
        padding: 0.75rem;
        background-color: #ffc107;
        border: none;
        border-radius: 4px;
        color: #121212;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease;
        margin-top: 1rem;
        font-size: 1.2rem;
      }

      button:hover {
        background-color: #e6b800;
      }
          `,
  ],
})
export class NotAuthorizedComponent {
  constructor(private router: Router) { }
  navigateLogin() {
    this.router.navigate(['/login']); // Redirige al login
  }
}