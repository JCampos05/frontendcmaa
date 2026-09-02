import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon';

export type StatCardVariant = 'brown' | 'navy' | 'success' | 'warning' | 'info' | 'purple' | 'teal';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="stat-card">
      <div class="stat-icon" [class]="'stat-icon--' + variant">
        <app-icon [name]="icon"></app-icon>
      </div>
      <div class="stat-content">
        <span class="stat-label">{{ label }}</span>
        <span class="stat-value">{{ value }}</span>
        <span class="stat-sub" *ngIf="sub">{{ sub }}</span>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input({ required: true }) icon!: string;
  @Input() variant: StatCardVariant = 'brown';
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() sub?: string;
}
