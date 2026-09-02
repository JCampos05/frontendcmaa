import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon';

export type StateMessageMode = 'loading' | 'error';

@Component({
  selector: 'app-state-message',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="state-container" [class.state-loading]="mode === 'loading'" [class.state-error]="mode === 'error'">
      <app-icon class="state-icon" [name]="mode === 'loading' ? 'spinner' : 'warning-circle'" [spin]="mode === 'loading'"></app-icon>
      <p>{{ title }}</p>
    </div>
  `
})
export class StateMessageComponent {
  @Input({ required: true }) mode!: StateMessageMode;
  @Input({ required: true }) title!: string;
}
