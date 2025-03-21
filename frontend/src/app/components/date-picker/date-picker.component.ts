import { Component, EventEmitter, Output } from '@angular/core';
import { format, addDays, subDays } from 'date-fns'; // Para manejar fechas
import { es } from 'date-fns/locale'; // Locale en español
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css'],
  standalone:false
})
export class DatePickerComponent {
  selectedDate: Date = new Date(); // Fecha seleccionada
  formattedDate: string = ''; // Fecha formateada para mostrar
  // Definir correctamente los íconos de FontAwesome
  chevronRight = faChevronRight;
  chevronLeft = faChevronLeft;
  @Output() dateChange = new EventEmitter<string>(); // Evento para notificar cambios de fecha

  constructor() {
    this.updateFormattedDate(); // Inicializa la fecha formateada
  }

  // Método para formatear la fecha
  updateFormattedDate(): void {
    this.formattedDate = format(this.selectedDate, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
  }

  // Cambiar la fecha
  onDateChange(): void {
    this.updateFormattedDate();
    this.dateChange.emit(format(this.selectedDate, 'yyyy-MM-dd'));
  }

  // Retroceder un día
  previousDay(): void {
    this.selectedDate = subDays(this.selectedDate, 1);
    this.onDateChange();
  }

  // Avanzar un día
  nextDay(): void {
    this.selectedDate = addDays(this.selectedDate, 1);
    this.onDateChange();
  }

  // Cargar citas (puedes personalizar este método)
  cargarCitas(): void {
    console.log('Cargar citas para:', this.formattedDate);
  }
}