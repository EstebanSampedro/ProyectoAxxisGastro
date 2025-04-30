import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private readonly excludedEndpoints = [
        'auth/doctor',
        'auth/admin',
    ];

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Excluir endpoints públicos
        if (this.isExcludedEndpoint(request.url)) {
            return next.handle(request);
        }

        // Solo interceptar llamadas a nuestro backend
        if (!request.url.startsWith(environment.api.baseUrl)) {
            return next.handle(request);
        }

        const token = this.authService.getToken();

        if (!token) {
            this.handleAuthError();
            return throwError(() => new Error('Token no disponible'));
        }

        const authReq = request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                return throwError(() => error);
            })
        );
    }

    private isExcludedEndpoint(url: string): boolean {
        return this.excludedEndpoints.some(endpoint =>
            url.includes(endpoint)
        );
    }

    private handleAuthError(): void {
        this.authService.clearSession();
        this.router.navigate(['/login'], {
            queryParams: {
                returnUrl: this.router.url,
                sessionExpired: true
            }
        });
    }
}