import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-advertencia-edicion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './advertencia-edicion-mesa.html',
  styleUrls: ['./advertencia-edicion-mesa.css']
})
export class ModalAdvertenciaEdicionComponent {
  @Input() visible = false;
  @Input() numeroMesa?: number;
  @Input() jugadorBlanco?: string;
  @Input() jugadorNegro?: string;
  @Input() resultadoActual?: string;
  
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    this.confirmar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancelar();
    }
  }
}