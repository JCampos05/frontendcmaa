import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  template: `
    <div class="state-container state-empty">
      <app-icon class="state-icon" [name]="icon" weight="regular"></app-icon>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      <app-button *ngIf="actionLabel" variant="primary" (clicked)="action.emit()">
        {{ actionLabel }}
      </app-button>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = 'calendar-x';
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input() actionLabel?: string;

  @Output() action = new EventEmitter<void>();
}
