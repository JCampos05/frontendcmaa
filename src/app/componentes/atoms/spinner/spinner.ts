import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="state-container state-loading">
      <app-icon class="state-icon" name="spinner" [spin]="true"></app-icon>
      <p *ngIf="label">{{ label }}</p>
    </div>
  `
})
export class SpinnerComponent {
  @Input() label?: string;
}
