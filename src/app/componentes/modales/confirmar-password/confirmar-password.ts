import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirmar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-password.html',
  styleUrl: './confirmar-password.css'
})
export class ConfirmarPasswordComponent {
  @Input() mostrar = false;
  @Input() titulo = 'Confirma tu contraseña';
  @Input() mensaje = 'Por seguridad, vuelve a ingresar tu contraseña para continuar.';
  @Input() textoConfirmar = 'Confirmar';
  @Input() cargando = false;
  @Input() error = '';

  @Output() confirmar = new EventEmitter<string>();
  @Output() cancelar = new EventEmitter<void>();

  password = '';

  onConfirmar(): void {
    if (!this.password) return;
    this.confirmar.emit(this.password);
  }

  onCancelar(): void {
    this.password = '';
    this.cancelar.emit();
  }
}
