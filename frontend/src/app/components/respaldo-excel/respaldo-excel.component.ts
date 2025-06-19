import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-respaldo-excel',
  templateUrl: './respaldo-excel.component.html',
  styleUrls: ['./respaldo-excel.component.css'],
  standalone: false
})
export class RespaldoExcelComponent {
  fechaInicio: string = '';
  fechaFin: string = '';

  constructor(private http: HttpClient) {}

  exportarExcel(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      alert('Por favor, seleccione ambas fechas');
      return;
    }

    // Endpoint: GET /api/citas/exportExcel?fechaInicio=...&fechaFin=...
    const url = `http://localhost:3000/api/citas/exportExcel?fechaInicio=${this.fechaInicio}&fechaFin=${this.fechaFin}`;

    // Pedir como Blob
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);

        // Crear enlace para forzar descarga
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `respaldo-citas-${Date.now()}.xlsx`;
        link.click();

        URL.revokeObjectURL(blobUrl);
      },
      error: (err) => {
        console.error('Error al exportar Excel:', err);
        alert('No se pudo exportar el Excel.');
      }
    });
  }
}
