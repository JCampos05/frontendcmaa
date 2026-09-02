import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SelectOption<T = unknown> {
  value: T;
  label: string;
}

/**
 * Select genérico basado en identidad de objeto (ngValue), no en string,
 * para poder seleccionar entidades completas (torneo, liga, etc.) igual
 * que hacían las views que usaban [(ngModel)] + [ngValue] directamente.
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <select class="form-control" [class.is-invalid]="invalid" [disabled]="disabled" [ngModel]="value" (ngModelChange)="onSelect($event)">
      <option *ngIf="placeholder" [ngValue]="null" disabled>{{ placeholder }}</option>
      <option *ngFor="let option of options" [ngValue]="option.value">{{ option.label }}</option>
    </select>
  `
})
export class SelectComponent<T = unknown> {
  @Input({ required: true }) options!: SelectOption<T>[];
  @Input() value: T | null = null;
  @Input() placeholder?: string;
  @Input() invalid = false;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<T>();

  onSelect(value: T): void {
    this.value = value;
    this.valueChange.emit(value);
  }
}
