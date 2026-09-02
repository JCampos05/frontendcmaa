import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon';
import { SpinnerComponent } from '../../atoms/spinner/spinner';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state';

export interface DataTableColumn {
  key: string;
  label: string;
  icon?: string;
  sortable?: boolean;
  align?: 'left' | 'center';
}

export type SortDirection = 'ASC' | 'DESC';

/**
 * Tabla genérica: dibuja thead + orden por columna + estados de
 * carga/vacío. El contenido de cada <tr> lo aporta el consumidor vía
 * <ng-template let-row> — la tabla no conoce el dominio de los datos.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, IconComponent, SpinnerComponent, EmptyStateComponent],
  template: `
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th
              *ngFor="let col of columns"
              [class.sortable]="col.sortable"
              [class.center]="col.align === 'center'"
              (click)="col.sortable ? sort(col.key) : null">
              <div class="th-content">
                <app-icon *ngIf="col.icon" [name]="col.icon"></app-icon>
                <span>{{ col.label }}</span>
                <app-icon *ngIf="col.sortable" [name]="sortIconFor(col.key)" weight="regular"></app-icon>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="loading">
            <td [attr.colspan]="columns.length"><app-spinner [label]="loadingText"></app-spinner></td>
          </tr>
          <tr *ngIf="!loading && rows.length === 0">
            <td [attr.colspan]="columns.length">
              <app-empty-state [icon]="emptyIcon" [title]="emptyTitle" [description]="emptyDescription"></app-empty-state>
            </td>
          </tr>
          <ng-container *ngIf="!loading">
            <ng-container *ngFor="let row of rows">
              <ng-container *ngTemplateOutlet="rowTemplate; context: { $implicit: row }"></ng-container>
            </ng-container>
          </ng-container>
        </tbody>
      </table>
    </div>
  `
})
export class DataTableComponent<T = unknown> {
  @Input({ required: true }) columns!: DataTableColumn[];
  @Input() rows: T[] = [];
  @Input() loading = false;
  @Input() loadingText = 'Cargando...';
  @Input() emptyIcon = 'tray';
  @Input() emptyTitle = 'Sin registros';
  @Input() emptyDescription = '';
  @Input() sortKey?: string;
  @Input() sortDir: SortDirection = 'DESC';

  @Output() sortChange = new EventEmitter<{ key: string; dir: SortDirection }>();

  @ContentChild(TemplateRef) rowTemplate!: TemplateRef<{ $implicit: T }>;

  sort(key: string): void {
    const dir: SortDirection = this.sortKey === key && this.sortDir === 'DESC' ? 'ASC' : 'DESC';
    this.sortChange.emit({ key, dir });
  }

  sortIconFor(key: string): string {
    if (this.sortKey !== key) return 'arrows-down-up';
    return this.sortDir === 'ASC' ? 'caret-up' : 'caret-down';
  }
}
