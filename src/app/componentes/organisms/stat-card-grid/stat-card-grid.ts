import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent, StatCardVariant } from '../../molecules/stat-card/stat-card';

export interface StatCardInput {
  icon: string;
  variant?: StatCardVariant;
  label: string;
  value: string | number;
  sub?: string;
}

@Component({
  selector: 'app-stat-card-grid',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
    <div class="grid-stats">
      <app-stat-card
        *ngFor="let stat of stats"
        [icon]="stat.icon"
        [variant]="stat.variant || 'brown'"
        [label]="stat.label"
        [value]="stat.value"
        [sub]="stat.sub">
      </app-stat-card>
    </div>
  `
})
export class StatCardGridComponent {
  @Input({ required: true }) stats!: StatCardInput[];
}
