import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      [type]="type"
      class="form-control"
      [class.is-invalid]="invalid"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [ngModel]="value"
      (ngModelChange)="onInput($event)"
      (blur)="onTouched()">
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true
    }
  ]
})
export class TextInputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'tel' | 'number' | 'password' = 'text';
  @Input() placeholder = '';
  @Input() invalid = false;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();

  value = '';

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(value: string): void {
    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
