import { enableProdMode, Injector } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { ConfigService } from './app/services/config.service';
import { firstValueFrom } from 'rxjs';

if (environment.production) {
  enableProdMode();
}

// Bootstrap de la aplicación con el ConfigService cargado
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then((moduleRef) => {
    const injector = moduleRef.injector;
    const configService = injector.get(ConfigService);

    // Carga la configuración antes de inicializar completamente la aplicación
    return firstValueFrom(configService.loadConfig())
      .catch(error => {
        console.error('Error al cargar la configuración. Cargando configuración por defecto:', error);
        configService.loadDefaultConfig();
        return null; // Retornamos null para continuar la cadena de promesas
      });
  })
  .then(() => {
    console.log('Aplicación inicializada con configuración cargada.');
  })
  .catch((err) => {
    console.error('Error fatal al inicializar la aplicación:', err);
  });