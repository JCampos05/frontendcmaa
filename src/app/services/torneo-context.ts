import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Torneo, EstadoTorneo } from '../models/torneo';

// Un torneo solo puede operarse como "torneo actual" (inscripciones, mesas,
// listas, resultados) una vez publicado — un borrador o uno cancelado nunca
// deben aparecer como seleccionables aquí.
const ESTADOS_OPERABLES: EstadoTorneo[] = ['publicado', 'en_curso', 'finalizado'];

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

  /**
   * Filtra los torneos que pueden operarse como "torneo actual" (excluye
   * borrador y cancelado) y los ordena por fecha ascendente. Debe usarse
   * antes de armar cualquier selector o de llamar a `elegirPorDefecto`.
   */
  prepararCandidatos(torneos: Torneo[]): Torneo[] {
    return torneos
      .filter(t => !!t.estado && ESTADOS_OPERABLES.includes(t.estado))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  /**
   * Elige el torneo por defecto entre `torneos` (ya ordenados por fecha
   * ascendente) cuando no hay una selección manual vigente:
   *   1. El marcado `esActual` (lo decide un adminGral vía el toggle
   *      dedicado — es el mismo criterio que usa la landing pública).
   *   2. Si ninguno está marcado, cae en la heurística por fecha: el más
   *      próximo dentro de los siguientes 3 días, o si no hay ninguno así,
   *      el primero de la lista (el de fecha más próxima, pasada o futura).
   */
  elegirPorDefecto(torneosOrdenados: Torneo[]): Torneo | undefined {
    const torneoMarcadoActual = torneosOrdenados.find(t => t.esActual);
    if (torneoMarcadoActual) return torneoMarcadoActual;

    const hoy = new Date();
    const tresDiasDespues = new Date();
    tresDiasDespues.setDate(hoy.getDate() + 3);

    const torneoEnRango = torneosOrdenados.find(t => {
      const fechaTorneo = new Date(t.fecha);
      return fechaTorneo >= hoy && fechaTorneo <= tresDiasDespues;
    });

    return torneoEnRango || torneosOrdenados[0];
  }
}
