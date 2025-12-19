import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-sesion-cerrada',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sesion-cerrada.html',
  styleUrl: './sesion-cerrada.css'
})
export class ModalSesionCerradaComponent {
  @Input() mostrar: boolean = false;
  @Output() continuar = new EventEmitter<void>();

  onContinuar(): void {
    this.continuar.emit();
  }
}