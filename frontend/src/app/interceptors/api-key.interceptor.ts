import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../services/config.service';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
    constructor(private configService: ConfigService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Verificar si la configuración está cargada
        if (!this.configService.isLoaded()) {
            // Si la configuración no está cargada, simplemente pasar la solicitud sin modificar
            return next.handle(req);
        }

        const apiKey = this.configService.get('apiKey'); // Obtiene la clave de la API desde el servicio

        // Solo modificar la solicitud si hay una apiKey disponible
        if (apiKey) {
            const clonedRequest = req.clone({
                setHeaders: {
                    'x-api-key': apiKey,
                },
            });
            return next.handle(clonedRequest);
        } else {
            // Si no hay apiKey, pasar la solicitud sin modificar
            return next.handle(req);
        }
    }
}