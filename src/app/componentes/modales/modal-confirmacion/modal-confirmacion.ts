import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-confirmacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirmacion.html',
  styleUrl: './modal-confirmacion.css'
})
export class ModalConfirmacionComponent {
  @Input() mostrar = false;
  @Input() titulo = 'Confirmar acción';
  @Input() mensaje = '¿Estás seguro de que deseas continuar?';
  @Input() mensajeSecundario = '';
  @Input() textoConfirmar = 'Confirmar';
  @Input() textoCancelar = 'Cancelar';
  @Input() tipoBotonPrimario: 'primary' | 'danger' | 'secondary' = 'primary';
  @Input() icono = 'fa-circle-question';
  @Input() iconoBotonPrimario = 'fa-check';
  @Input() tipoAdvertencia = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    this.confirmar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}