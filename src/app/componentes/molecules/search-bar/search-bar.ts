import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../atoms/icon/icon';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="search-box">
      <app-icon name="magnifying-glass"></app-icon>
      <input
        type="text"
        [placeholder]="placeholder"
        [ngModel]="value"
        (ngModelChange)="onInput($event)">
    </div>
  `,
  styleUrls: ['./search-bar.css']
})
export class SearchBarComponent {
  @Input() value = '';
  @Input() placeholder = 'Buscar...';

  @Output() search = new EventEmitter<string>();

  onInput(value: string): void {
    this.value = value;
    this.search.emit(value);
  }
}
