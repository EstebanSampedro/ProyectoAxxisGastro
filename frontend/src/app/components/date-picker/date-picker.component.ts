// date-picker.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { format, addDays, subDays, parseISO } from 'date-fns'; // añadimos parseISO
import { es } from 'date-fns/locale';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css'],
  standalone: false
})
export class DatePickerComponent {
  selectedDate: Date = new Date();
  formattedDate: string = '';
  chevronRight = faChevronRight;
  chevronLeft  = faChevronLeft;
  @Output() dateChange = new EventEmitter<string>();

  constructor() {
    this.updateFormattedDate();
  }

  private updateFormattedDate(): void {
    this.formattedDate = format(
      this.selectedDate,
      "EEEE, dd 'de' MMMM 'del' yyyy",
      { locale: es }
    );
  }

  /** llamado tanto por flechitas como por el picker */
  onDateChange(): void {
    this.updateFormattedDate();
    this.dateChange.emit(format(this.selectedDate, 'yyyy-MM-dd'));
  }

  /** handler del input[type=date] */
  onInputChange(newDateStr: string): void {
    this.selectedDate = parseISO(newDateStr);
    this.onDateChange();
  }

  previousDay(): void {
    this.selectedDate = subDays(this.selectedDate, 1);
    this.onDateChange();
  }

  nextDay(): void {
    this.selectedDate = addDays(this.selectedDate, 1);
    this.onDateChange();
  }
}
