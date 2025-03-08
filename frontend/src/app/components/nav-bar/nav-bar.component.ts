import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
  standalone: false
})
export class NavBarComponent {

  constructor(private router: Router, private authService: AuthService) { }

  goToInicio() {
    this.router.navigate(['/inicio']);
  }

  goToHistorialCitas() {
    this.router.navigate(['/historial/citas']);
  }

  goToModificaciones() {
    this.router.navigate(['/historial/modificaciones']);
  }

  goToConfirmaciones() {
    this.router.navigate(['/historial/confirmaciones']);
  }

  goToUsuarios() {
    this.router.navigate(['/configuraciones/usuarios']);
  }

  goToDoctores() {
    this.router.navigate(['/configuraciones/doctores']);
  }

  goToTorres() {
    this.router.navigate(['/configuraciones/torres']);
  }

  goToSalir() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}