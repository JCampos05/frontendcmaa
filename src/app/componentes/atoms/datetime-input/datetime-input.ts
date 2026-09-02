import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

/**
 * Input de fecha y hora con calendario (flatpickr) en vez del picker nativo del
 * navegador — el nativo (type="datetime-local") es incómodo de llenar a mano.
 * El valor se mantiene en el mismo formato "YYYY-MM-DDTHH:mm" que ya usa el
 * backend (ver torneo.validation.ts), así que es un reemplazo directo.
 */
@Component({
  selector: 'app-datetime-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input
      #inputRef
      type="text"
      class="form-control"
      [class.is-invalid]="invalid"
      [placeholder]="placeholder"
      [disabled]="disabled"
      readonly>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatetimeInputComponent),
      multi: true
    }
  ]
})
export class DatetimeInputComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input() placeholder = 'Selecciona fecha y hora';
  @Input() invalid = false;
  @Input() minDate: string | null = null;

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('inputRef') private inputRef!: ElementRef<HTMLInputElement>;

  value = '';
  disabled = false;

  private fp: flatpickr.Instance | null = null;
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.fp = flatpickr(this.inputRef.nativeElement, {
      enableTime: true,
      time_24hr: true,
      dateFormat: 'Y-m-d\\TH:i',
      locale: Spanish,
      minDate: this.minDate || undefined,
      defaultDate: this.value || undefined,
      onChange: (_dates, dateStr) => {
        this.value = dateStr;
        this.onChange(dateStr);
        this.valueChange.emit(dateStr);
      },
      onClose: () => this.onTouched()
    });
  }

  writeValue(value: string): void {
    this.value = value ?? '';
    this.fp?.setDate(this.value || '', false);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.fp?.set('clickOpens', false);
    } else {
      this.fp?.set('clickOpens', true);
    }
  }

  ngOnDestroy(): void {
    this.fp?.destroy();
  }
}
