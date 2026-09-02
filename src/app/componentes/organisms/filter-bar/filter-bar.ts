import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../molecules/search-bar/search-bar';
import { FilterChipsComponent, FilterChipOption } from '../../molecules/filter-chips/filter-chips';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, FilterChipsComponent],
  template: `
    <div class="filters-section">
      <app-search-bar [value]="searchValue" [placeholder]="searchPlaceholder" (search)="searchChange.emit($event)"></app-search-bar>
      <app-filter-chips [options]="filterOptions" [active]="activeFilter" (change)="filterChange.emit($event)"></app-filter-chips>
    </div>
  `,
  styleUrls: ['./filter-bar.css']
})
export class FilterBarComponent {
  @Input() searchValue = '';
  @Input() searchPlaceholder = 'Buscar...';
  @Input({ required: true }) filterOptions!: FilterChipOption[];
  @Input() activeFilter!: string;

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string>();
}
