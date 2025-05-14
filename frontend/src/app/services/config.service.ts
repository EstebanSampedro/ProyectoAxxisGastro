import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
interface AppConfig { apiKey: string; }
@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private readonly config = environment;
    private appConfig!: AppConfig;        // se cargará desde JSON
    constructor(private http: HttpClient) {
        this.validateEnvironment();
    }

    /** Llamado por APP_INITIALIZER: carga /assets/config.json */
    loadAppConfig(): Promise<void> {
        return this.http
            .get<AppConfig>('/assets/config.json')
            .toPromise()
            .then(cfg => {
                if (!cfg) {
                    throw new Error('Failed to load app configuration from /assets/config.json');
                }
                this.appConfig = cfg;
            });
    }

    /**
     * Obtiene el valor de configuración completo
     */
    getAll(): any {
        return this.config;
    }

    /**
     * Obtiene la URL base de la API
     */
    getApiUrl(): string {
        return this.config.api.baseUrl;
    }

    /**
     * Obtiene un endpoint específico
     * @param path Ruta del endpoint (puede ser anidada con puntos)
     * @example getEndpoint('authAdmin') -> '/auth/admin'
     * @example getEndpoint('citas.filterByDate') -> '/citas/byDate'
     */
    getEndpoint(path: string): string {
        const parts = path.split('.');
        let result: any = this.config.api.endpoints;

        for (const part of parts) {
            if (result[part] === undefined) {
                console.error(`Endpoint no encontrado: ${path}`);
                return '';
            }
            result = result[part];
        }

        return result;
    }
    /**
     * Obtiene la URL completa para un endpoint
     * @param module Nombre del módulo (ej: 'citas', 'auth')
     * @param endpoint Nombre del endpoint específico (ej: 'getAll', 'register')
     * @returns URL completa formada por baseUrl + endpoint
     * @throws Error si el módulo o endpoint no existen
     */
    getFullUrl(module: string, endpoint?: string): string {
        // 1. Obtener base URL
        const baseUrl = environment.api.baseUrl.replace(/\/$/, '');

        // 2. Obtener ruta del endpoint
        const moduleEndpoints = (environment.api.endpoints as Record<string, any>)[module];

        let path = '';
        if (endpoint && moduleEndpoints && typeof moduleEndpoints === 'object') {
            path = moduleEndpoints[endpoint] || '';
        } else if (typeof moduleEndpoints === 'string') {
            path = moduleEndpoints;
        }

        // 3. Combinar evitando dobles barras
        return `${baseUrl}/${path.replace(/^\//, '')}`;
    }
    /**
     * Verifica si estamos en entorno de producción
     */
    isProduction(): boolean {
        return this.config.production;
    }

    /**
     * Valida que la configuración mínima requerida esté presente
     */
    private validateEnvironment(): void {
        if (!this.config.api?.baseUrl) {
            console.error('Configuración de API no encontrada en environment');
        }

        if (!this.config.api?.endpoints?.authAdmin) {
            console.warn('Endpoint authAdmin no configurado');
        }
    }

    /**
     * Método para compatibilidad con versiones anteriores
     * @deprecated Usar getEndpoint() o getFullUrl() en su lugar
     */
    get(key: string): any {
        console.warn('Método get() está deprecado. Usar getEndpoint() o getFullUrl()');
        return this.getEndpoint(key);
    }

    /**
     * Método para compatibilidad con versiones anteriores
     * @deprecated Ya no es necesario cargar la configuración
     */
    isLoaded(): boolean {
        return true; // Siempre está cargado cuando usamos environment.ts
    }

    /** Nuevo: devuelve la API key cargada desde JSON */
    get apiKey(): string {
        if (!this.appConfig) {
            throw new Error('ConfigService: no se cargó config.json');
        }
        return this.appConfig.apiKey;
    }
}