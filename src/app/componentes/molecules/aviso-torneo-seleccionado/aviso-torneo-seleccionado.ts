import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon';

/**
 * Aviso reutilizable para las vistas hermanas de "Torneo Actual"
 * (Inscripciones, Listas, Mesas, Resultados): cuando el admin tiene más de
 * un torneo asignado, aclara cuál está viendo y ofrece un atajo directo
 * para cambiarlo en vez de solo indicarle a dónde ir.
 */
@Component({
  selector: 'app-aviso-torneo-seleccionado',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './aviso-torneo-seleccionado.html',
  styleUrl: './aviso-torneo-seleccionado.css'
})
export class AvisoTorneoSeleccionadoComponent {
  @Input({ required: true }) torneoNombre!: string | null | undefined;

  constructor(private router: Router) {}

  irATorneoActual(): void {
    this.router.navigate(['/main-view/torneo-actual']);
  }
}
