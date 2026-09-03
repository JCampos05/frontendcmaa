import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Torneo } from '../models/torneo';

/**
 * Torneo actualmente seleccionado por el admin dentro del apartado "Torneo
 * Actual" (Inscripciones, Listas, Mesas, Resultados) — comparte la
 * selección entre esas vistas hermanas, que son rutas independientes: si el
 * admin elige otro torneo (de los varios que tenga asignados) en cualquiera
 * de ellas, las demás deben reflejar ese mismo torneo al navegar, no volver
 * a auto-elegir el más próximo por su cuenta.
 *
 * No se limpia en logout explícitamente: cada vista valida que el torneo
 * guardado siga estando en la lista recién cargada para el usuario actual
 * antes de usarlo — si no, lo ignora y vuelve a auto-elegir.
 */
@Injectable({
  providedIn: 'root'
})
export class TorneoContextService {
  private torneoSeleccionadoSubject = new BehaviorSubject<Torneo | null>(null);
  public torneoSeleccionado$ = this.torneoSeleccionadoSubject.asObservable();

  get torneoSeleccionadoValue(): Torneo | null {
    return this.torneoSeleccionadoSubject.value;
  }

  seleccionar(torneo: Torneo | null): void {
    this.torneoSeleccionadoSubject.next(torneo);
  }
}
