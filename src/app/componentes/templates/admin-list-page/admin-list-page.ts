import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../organisms/page-header/page-header';
import { FilterBarComponent } from '../../organisms/filter-bar/filter-bar';
import { RecordCardListComponent } from '../../organisms/record-card-list/record-card-list';
import { FilterChipOption } from '../../molecules/filter-chips/filter-chips';

/**
 * Shell de layout sin lógica de negocio: PageHeader + FilterBar + RecordCardList.
 * La vista concreta (torneos, ligas, etc.) inyecta su propio servicio y le pasa
 * datos/handlers a este template — así el mismo template sirve a dominios distintos.
 */
@Component({
  selector: 'app-admin-list-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, FilterBarComponent, RecordCardListComponent],
  template: `
    <div class="admin-list-page">
      <app-page-header [icon]="headerIcon" [title]="headerTitle" [subtitle]="headerSubtitle">
        <ng-content select="[actions]" ngProjectAs="[actions]"></ng-content>
      </app-page-header>

      <app-filter-bar
        [searchValue]="searchValue"
        [searchPlaceholder]="searchPlaceholder"
        [filterOptions]="filterOptions"
        [activeFilter]="activeFilter"
        (searchChange)="searchChange.emit($event)"
        (filterChange)="filterChange.emit($event)">
      </app-filter-bar>

      <app-record-card-list
        [items]="items"
        [loading]="loading"
        [loadingText]="loadingText"
        [emptyIcon]="emptyIcon"
        [emptyTitle]="emptyTitle"
        [emptyDescription]="emptyDescription">
        <ng-template let-item>
          <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }"></ng-container>
        </ng-template>
      </app-record-card-list>
    </div>
  `,
  styleUrls: ['./admin-list-page.css']
})
export class AdminListPageComponent<T = unknown> {
  @Input({ required: true }) headerIcon!: string;
  @Input({ required: true }) headerTitle!: string;
  @Input() headerSubtitle = '';

  @Input() searchValue = '';
  @Input() searchPlaceholder = 'Buscar...';
  @Input({ required: true }) filterOptions!: FilterChipOption[];
  @Input() activeFilter!: string;

  @Input() items: T[] = [];
  @Input() loading = false;
  @Input() loadingText = 'Cargando...';
  @Input() emptyIcon = 'calendar-x';
  @Input({ required: true }) emptyTitle!: string;
  @Input({ required: true }) emptyDescription!: string;

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string>();

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<{ $implicit: T }>;
}
