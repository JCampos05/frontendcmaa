import { Component, ContentChild, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateMessageComponent } from '../../molecules/state-message/state-message';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state';

/**
 * Lista de tarjetas genérica: orquesta loading/empty/error y deja el
 * contenido de cada tarjeta a cargo del consumidor vía <ng-template let-item>.
 * No conoce el dominio (torneo, liga, etc.) — solo itera `items`.
 */
@Component({
  selector: 'app-record-card-list',
  standalone: true,
  imports: [CommonModule, StateMessageComponent, EmptyStateComponent],
  template: `
    <app-state-message *ngIf="loading" mode="loading" [title]="loadingText"></app-state-message>

    <div class="record-card-list" *ngIf="!loading && items.length > 0">
      <div class="record-card" *ngFor="let item of items">
        <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }"></ng-container>
      </div>
    </div>

    <app-empty-state
      *ngIf="!loading && items.length === 0"
      [icon]="emptyIcon"
      [title]="emptyTitle"
      [description]="emptyDescription">
    </app-empty-state>
  `,
  styleUrls: ['./record-card-list.css']
})
export class RecordCardListComponent<T = unknown> {
  @Input() items: T[] = [];
  @Input() loading = false;
  @Input() loadingText = 'Cargando...';
  @Input() emptyIcon = 'calendar-x';
  @Input({ required: true }) emptyTitle!: string;
  @Input({ required: true }) emptyDescription!: string;

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<{ $implicit: T }>;
}
