import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
    constructor(private configService: ConfigService, private router: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Verificar si la configuración está cargada
        if (!this.configService.isLoaded()) {
            // Si la configuración no está cargada, simplemente pasar la solicitud sin modificar
            return next.handle(req);
        }

        const apiKey = this.configService.get('apiKey'); // Obtiene la clave de la API desde el servicio

        // Solo modificar la solicitud si hay una apiKey disponible
        const clonedRequest = apiKey
            ? req.clone({
                setHeaders: {
                    'x-api-key': apiKey,
                },
            })
            : req;

        // Manejar la respuesta y redirigir en caso de 403
        return next.handle(clonedRequest).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 403) {
                    console.error('Acceso denegado (403). Redirigiendo al login...');
                    this.router.navigate(['/not-authorized']); // Redirige al login
                }
                return throwError(() => error); // Propaga el error
            })
        );
    }
}