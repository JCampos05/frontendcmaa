import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon';
import { ButtonComponent } from '../../atoms/button/button';

/**
 * Layout de página completa para errores comunes (404, 403, error general).
 * Mismo patrón visual que ModalSesionCerradaComponent (ícono circular con
 * degradado, título, mensaje, mensaje secundario opcional, botón de acción)
 * pero como página enrutada, no overlay/modal.
 */
@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  templateUrl: './error-page.html',
  styleUrl: './error-page.css'
})
export class ErrorPageComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;
  @Input() secondaryMessage?: string;
  @Input() actionLabel = 'Volver al inicio';
  @Input() actionIcon = 'house';

  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}
