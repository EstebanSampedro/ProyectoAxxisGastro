import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Verifica si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']); // Redirige al login si no está autenticado
      return false;
    }

    const expectedRoles = route.data['role']; // Puede ser un string o un array
    const user = this.authService.currentUserValue; // Obtiene el usuario actual
    if (!user) {
      this.router.navigate(['/login']); // Redirige al login si no hay usuario
      return false;
    }
    const userRole = user.permiso.toLowerCase(); // Normaliza el permiso del usuario

    if (Array.isArray(expectedRoles)) {
      const normalizedRoles = expectedRoles.map((role: string) => role.toLowerCase());
      if (normalizedRoles.includes(userRole)) {
        return true;
      }
    } else if (userRole === expectedRoles.toLowerCase()) {
      return true;
    }

    this.router.navigate(['/not-authorized']);
    return false;
  }
}
