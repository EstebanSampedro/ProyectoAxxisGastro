import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  standalone: false
})
export class MenuComponent {
  constructor(private router: Router, private interfaceService: ApiService) { }

  // Redirige a la ruta que se pase como parámetro en una nueva ventana y establece el título dinámicamente
  goTo(route: string) {
    this.interfaceService.setCurrentInterface(route);
    const baseUrl = window.location.origin; // Obtiene la URL base de la aplicación
    const fullUrl = `${baseUrl}/${route}`; // Construye la URL completa

    // Abrir nueva ventana
    const newWindow = window.open(fullUrl, '_blank');

    // Establecer el título dinámicamente
    if (newWindow) {
      newWindow.onload = () => {
        const routeTitle = this.getRouteTitle(route); // Obtener título basado en la ruta
        newWindow.document.title = routeTitle;
      };
    }
  }

  // Lógica para cerrar sesión: limpia el token y redirige a login
  logout() {
    sessionStorage.removeItem('token'); // Limpia el token o cualquier dato de sesión
    this.router.navigate(['/login']);
  }

  // Devuelve un título basado en la ruta
  private getRouteTitle(route: string): string {
    const titles: { [key: string]: string } = {
      'registro-citas': 'Registro de Citas',
      'consultas': 'Consultas Médicas',
      'respaldo-excel': 'Respaldo de Datos',
      'login': 'Inicio de Sesión'
    };
    return titles[route] || 'Axxis Gastro';
  }
}
