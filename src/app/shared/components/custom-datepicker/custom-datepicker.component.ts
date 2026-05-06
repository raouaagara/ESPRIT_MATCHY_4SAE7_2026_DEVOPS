import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-datepicker',
  templateUrl: './custom-datepicker.component.html',
  styleUrls: ['./custom-datepicker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDatepickerComponent),
      multi: true
    }
  ]
})
export class CustomDatepickerComponent implements ControlValueAccessor {
  @Input() placeholder = 'Select date';
  @Output() dateChange = new EventEmitter<string>();

  isOpen = false;
  selectedDate: Date | null = null;
  displayValue = '';
  
  currentMonth: Date = new Date();
  weeks: Date[][] = [];
  
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  private onChange: any = () => {};
  private onTouched: any = () => {};

  constructor() {
    this.generateCalendar();
  }

  writeValue(value: any): void {
    if (value) {
      this.selectedDate = new Date(value);
      this.displayValue = this.formatDate(this.selectedDate);
      this.currentMonth = new Date(this.selectedDate);
      this.generateCalendar();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  toggleCalendar(): void {
    this.isOpen = !this.isOpen;
  }

  closeCalendar(): void {
    this.isOpen = false;
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
    this.displayValue = this.formatDate(date);
    const isoDate = date.toISOString().split('T')[0];
    this.onChange(isoDate);
    this.dateChange.emit(isoDate);
    this.closeCalendar();
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    this.generateCalendar();
  }

  selectToday(): void {
    this.selectDate(new Date());
  }

  clear(): void {
    this.selectedDate = null;
    this.displayValue = '';
    this.onChange('');
    this.dateChange.emit('');
    this.closeCalendar();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isSelected(date: Date): boolean {
    if (!this.selectedDate) return false;
    return date.getDate() === this.selectedDate.getDate() &&
           date.getMonth() === this.selectedDate.getMonth() &&
           date.getFullYear() === this.selectedDate.getFullYear();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth();
  }

  private generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    this.weeks = [];
    let currentDate = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays: Date[] = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      this.weeks.push(weekDays);
      
      if (currentDate > lastDay && currentDate.getDay() === 0) break;
    }
  }

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }
}
