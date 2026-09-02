import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon';

export interface FilterChipOption {
  value: string;
  label: string;
  icon?: string;
  count?: number;
}

@Component({
  selector: 'app-filter-chips',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="filter-buttons">
      <button
        *ngFor="let option of options"
        type="button"
        class="filter-btn"
        [class.active]="active === option.value"
        (click)="change.emit(option.value)">
        <app-icon *ngIf="option.icon" [name]="option.icon"></app-icon>
        {{ option.label }}
        <span class="badge" *ngIf="option.count !== undefined">{{ option.count }}</span>
      </button>
    </div>
  `,
  styleUrls: ['./filter-chips.css']
})
export class FilterChipsComponent {
  @Input({ required: true }) options!: FilterChipOption[];
  @Input() active!: string;

  @Output() change = new EventEmitter<string>();
}
