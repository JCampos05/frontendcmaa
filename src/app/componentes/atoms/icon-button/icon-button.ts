import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';
import { ButtonVariant } from '../button/button';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      type="button"
      [class]="classes"
      [attr.title]="ariaLabel"
      [attr.aria-label]="ariaLabel"
      [disabled]="disabled"
      (click)="onClick($event)">
      <app-icon [name]="icon"></app-icon>
    </button>
  `
})
export class IconButtonComponent {
  @Input({ required: true }) icon!: string;
  @Input() variant: ButtonVariant = 'secondary';
  @Input() size: 'md' | 'lg' = 'md';
  @Input({ required: true }) ariaLabel!: string;
  @Input() disabled = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  get classes(): string {
    const classes = ['btn', 'btn-icon', `btn-${this.variant}`];
    if (this.size === 'lg') classes.push('btn-icon-lg');
    return classes.join(' ');
  }

  onClick(event: MouseEvent): void {
    if (this.disabled) return;
    this.clicked.emit(event);
  }
}
