import { Component, Input, HostBinding } from '@angular/core';

export type IconWeight = 'regular' | 'bold' | 'fill';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: ''
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() weight: IconWeight = 'bold';
  @Input() spin = false;

  @HostBinding('class') get hostClass(): string {
    const weightClass = this.weight === 'regular' ? 'ph' : `ph-${this.weight}`;
    const classes = ['app-icon', weightClass, `ph-${this.name}`];
    if (this.spin) classes.push('ph-spin');
    return classes.join(' ');
  }
}
