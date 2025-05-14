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
import { environment } from '../../environments/environment';
import { ConfigService } from '../services/config.service';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
    private readonly excludedEndpoints = [
        'auth/login',
    ];

    constructor(
        private router: Router,
        private configService: ConfigService  // inyectamos el servicio
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // 1. Excluir endpoints que no necesitan API key
        if (this.isExcludedEndpoint(req.url)) {
            return next.handle(req);
        }

        // 2. Solo inyectar en peticiones a nuestro backend
        if (!req.url.startsWith(environment.api.baseUrl)) {
            return next.handle(req);
        }

        // 3. Obtener apiKey desde ConfigService (ya cargado por APP_INITIALIZER)
        let apiKey: string;
        try {
            apiKey = this.configService.apiKey;
        } catch (e) {
            console.error('ConfigService no cargado o apiKey no disponible', e);
            return throwError(() => new Error('API Key no disponible'));
        }

        // 4. Clonar la petición con headers
        const clonedRequest = req.clone({
            setHeaders: {
                'x-api-key': apiKey,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        // 5. Gestionar errores 403
        return next.handle(clonedRequest).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 403) {
                    console.error('Acceso denegado (403)');
                    this.router.navigate(['/not-authorized'], {
                        queryParams: { returnUrl: this.router.url }
                    });
                }
                return throwError(() => error);
            })
        );
    }

    private isExcludedEndpoint(url: string): boolean {
        return this.excludedEndpoints.some(endpoint =>
            url.includes(endpoint)
        );
    }
}
