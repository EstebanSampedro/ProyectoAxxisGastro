import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
  standalone: false
})
export class NavBarComponent {

  currentInterface: string = 'registro-citas'; 
  
  constructor(private navBarService: ApiService, private router: Router, private authService:AuthService) {}

  ngOnInit() {
    // Suscríbete al servicio para obtener el estado actual
    this.navBarService.currentInterface$.subscribe((interfaceName) => {
      this.currentInterface = interfaceName;
    });
  }

  goToInicio() {
    this.router.navigate(['/menu']);
  }

  goToHistorialCitas() {
    this.router.navigate(['/historial-citas']);
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