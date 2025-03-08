import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  standalone: false
})
export class MenuComponent {
  constructor(private router: Router) {}

  // Redirige a la ruta que se pase como parámetro
  goTo(route: string) {
    this.router.navigate([`/${route}`]);
  }

  // Lógica para cerrar sesión: limpia el token y redirige a login
  logout() {
    localStorage.removeItem('token'); // Limpia el token o cualquier dato de sesión
    this.router.navigate(['/login']);
  }
}
