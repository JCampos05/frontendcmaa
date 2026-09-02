import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger' | 'success' | 'info' | 'warning' | 'purple';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Envuelve el sistema de botones ya definido en styles/buttons.css (.btn, .btn-*).
 * No define estilos propios: solo compone las clases existentes.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './button.html'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() icon?: string;
  @Input() iconPos: 'left' | 'right' = 'left';
  @Input() block = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' = 'button';

  @Output() clicked = new EventEmitter<MouseEvent>();

  get classes(): string {
    const classes = ['btn', `btn-${this.variant}`];
    if (this.size !== 'md') classes.push(`btn-${this.size}`);
    if (this.block) classes.push('btn-block');
    return classes.join(' ');
  }

  onClick(event: MouseEvent): void {
    if (this.disabled || this.loading) return;
    this.clicked.emit(event);
  }
}
