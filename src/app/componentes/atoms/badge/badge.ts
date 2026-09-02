import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';

export type BadgeStatus = 'confirmed' | 'active' | 'pending' | 'inactive' | 'cancelled' | 'partial' | 'in-progress' | 'finished' | 'scheduled' | 'retired';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <span class="status-badge" [class]="'status-badge--' + status">
      <app-icon *ngIf="icon" [name]="icon"></app-icon>
      {{ text }}
    </span>
  `
})
export class BadgeComponent {
  @Input({ required: true }) status!: BadgeStatus;
  @Input({ required: true }) text!: string;
  @Input() icon?: string;
}
