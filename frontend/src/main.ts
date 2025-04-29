import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Bootstrap simplificado sin carga de configuración
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => {
    console.log('Aplicación inicializada correctamente');
    console.log('Entorno:', environment.production ? 'Producción' : 'Desarrollo');
    console.log('API Base URL:', environment.api.baseUrl);
  })
  .catch((err) => {
    console.error('Error fatal al inicializar la aplicación:', err);
  });