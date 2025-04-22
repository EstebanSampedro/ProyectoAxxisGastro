import { Component } from '@angular/core';

@Component({
  selector: 'app-not-authorized',
  template: `
    <div class="not-authorized">
      <h1>Acceso Denegado</h1>
      <p>No tienes permiso para acceder a esta página.</p>
    </div>
  `,
  styles: [
    `
      .not-authorized {
        text-align: center;
        margin-top: 50px;
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
    `,
  ],
})
export class NotAuthorizedComponent { }