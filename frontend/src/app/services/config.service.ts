import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import * as yaml from 'js-yaml';

@Injectable({
    providedIn: 'root',
})
export class ConfigService {
    private config: any = null;
    private httpClientWithoutInterceptors: HttpClient;

    constructor(private http: HttpClient, private httpBackend: HttpBackend) {
        // Crear una instancia de HttpClient que no use interceptores
        this.httpClientWithoutInterceptors = new HttpClient(httpBackend);
    }

    loadConfig(): Observable<any> {
        // Usar el cliente HTTP que evita los interceptores
        return this.httpClientWithoutInterceptors.get('assets/config.yaml', { responseType: 'text' })
            .pipe(
                tap(yamlText => {
                    try {
                        this.config = yaml.load(yamlText);
                        console.log('Configuración cargada correctamente');
                    } catch (error) {
                        console.error('Error al parsear el archivo YAML:', error);
                        throw error;
                    }
                }),
                map(() => this.config),
                catchError(error => {
                    console.error('Error al cargar el archivo de configuración:', error);
                    throw error;
                })
            );
    }

    get(key: string): any {
        if (!this.config) {
            console.warn('Se intentó acceder a la configuración antes de cargarla');
            return null;
        }
        return key ? this.config[key] : this.config;
    }

    isLoaded(): boolean {
        return this.config !== null;
    }

    // Método para cargar configuración de respaldo si falla la carga principal
    loadDefaultConfig(): void {
        this.config = {
            apiKey: 'asdfghjklqwertyuiopzxcvbnm1234567890',
            apiBaseUrl: 'http://localhost:3000/api'
        };
        console.warn('Se ha cargado la configuración por defecto debido a un error');
    }
}