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

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
    private readonly excludedEndpoints = [
        'auth/login',
    ];

    constructor(private router: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Excluir endpoints que no necesitan API key
        if (this.isExcludedEndpoint(req.url)) {
            return next.handle(req);
        }

        // Verificar si es una solicitud a nuestro backend
        if (!req.url.startsWith(environment.api.baseUrl)) {
            return next.handle(req);
        }

        if (!environment.api.apiKey) {
            console.error('API Key no configurada en environment');
            return throwError(() => new Error('API Key no configurada'));
        }

        const clonedRequest = req.clone({
            setHeaders: {
                'x-api-key': environment.api.apiKey,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

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