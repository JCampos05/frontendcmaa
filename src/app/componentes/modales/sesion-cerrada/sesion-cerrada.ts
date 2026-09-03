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
  @Input() motivo: 'remota' | 'rol' | 'torneo' = 'remota';
  @Output() continuar = new EventEmitter<void>();

  /**
   * Solo 'torneo' deja la sesión viva (basta con refrescar). 'rol' y
   * 'remota' exigen volver a loguear: 'rol' porque cambia qué rutas/menú le
   * corresponden al usuario y hace falta una reautenticación real para que
   * guards/sidebar se reconstruyan consistentes; 'remota' porque el token ya
   * no es válido.
   */
  get requiereReautenticacion(): boolean {
    return this.motivo !== 'torneo';
  }

  /** Tono amigable (icono/mensaje) para 'rol' y 'torneo' — no es un problema de seguridad, a diferencia de 'remota'. */
  get esAvisoAmigable(): boolean {
    return this.motivo !== 'remota';
  }

  onContinuar(): void {
    this.continuar.emit();
  }
}