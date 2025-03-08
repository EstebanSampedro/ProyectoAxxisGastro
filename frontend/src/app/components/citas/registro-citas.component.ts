import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';


@Component({
  selector: 'app-registro-citas',
  templateUrl: './registro-citas.component.html',
  styleUrls: ['./registro-citas.component.css'],
  standalone: false
})
export class RegistroCitasComponent implements OnInit {
  selectedDate: string = '';
  formattedDate: string = '';
  observaciones: string = '';
  citas: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    this.onDateChange();
  }

  // =============== MÉTODOS PARA LA BARRA DE MENÚ ===============

  // 1. INICIO
  goToInicio() {
    // Si deseas que no haga nada si ya estás en "registro-citas":
    // O si quieres un enlace externo, puedes usar:
    // window.location.href = 'http://tuservidor/axxis-citas/paginas/principal';

    // Ejemplo: si tu "INICIO" es la misma pantalla:
    console.log('Ya estás en la pantalla de INICIO (Registro de Citas).');
  }

  // 2. HISTORIAL
  goToHistorialCitas() {
    // Ejemplo: si tienes una ruta Angular "/historial-citas"
    this.router.navigate(['/historial-citas']);
    // O si es un enlace externo:
    // window.location.href = 'http://tuservidor/axxis-citas/paginas/historial-citas';
  }

  goToModificaciones() {
    // Ejemplo:
    this.router.navigate(['/historial-modificaciones']);
  }

  goToConfirmaciones() {
    // Ejemplo:
    this.router.navigate(['/historial-confirmaciones']);
  }

  // 3. CONFIGURACIONES
  goToUsuarios() {
    // Ejemplo:
    this.router.navigate(['/config-usuarios']);
  }

  goToDoctores() {
    this.router.navigate(['/config-doctores']);
  }

  goToTorres() {
    this.router.navigate(['/config-torres']);
  }

  // 4. SALIR
  goToSalir() {
    // Si tu "menú principal" es "/menu":
    this.router.navigate(['/menu']);

    // O si es un enlace externo:
    // window.location.href = 'http://tuservidor/axxis-citas/paginas/menu-principal';
  }

  // =============== LÓGICA DE REGISTRO DE CITAS ===============

  onDateChange() {
    const parsedDate = parseISO(this.selectedDate);
    this.formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'del' yyyy", {
      locale: es
    });
  }

  buscar() {
    console.log('Buscando citas para la fecha:', this.selectedDate);
    this.citas = [
      {
        horaInicio: '07:00',
        horaFin: '07:30',
        torre: 'TORRE 1',
        paciente: 'Juan Pérez',
        procedimiento: 'Colonoscopía',
        telefono: '0991234567',
        seguro: 'Privado',
        confirmado: 'si',
        observaciones: 'Traer exámenes previos',
        colorCita: '#F7D358'
      },
      {
        horaInicio: '08:00',
        horaFin: '08:30',
        torre: 'TORRE 2',
        paciente: 'María González',
        procedimiento: 'Endoscopía',
        telefono: '0987654321',
        seguro: 'IESS',
        confirmado: '',
        observaciones: '',
        colorCita: ''
      }
    ];
  }

  imprimir() {
    console.log('Imprimiendo citas del día', this.selectedDate);
  }

  guardarObservaciones() {
    console.log('Guardando observaciones:', this.observaciones);
  }
}
