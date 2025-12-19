import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { TorneoCategoria } from '../../models/torneo-categoria';

@Injectable({
  providedIn: 'root'
})
export class TorneoCategoriaService {
  private apiUrl = `${environment.apiUrl}/torneo-categorias`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/torneo-categorias/torneo/:torneo_id - Obtener categorías de un torneo (público)
   */
  getByTorneo(idTorneo: number): Observable<TorneoCategoria[]> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}`).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * GET /api/torneo-categorias/torneo/:torneo_id/categoria/:categoria_id - Obtener una categoría específica (público)
   */
  getOne(idTorneo: number, idCategoria: number): Observable<TorneoCategoria> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}/categoria/${idCategoria}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/torneo-categorias - Crear o actualizar categoría de torneo (protegido)
   * PUT /api/torneo-categorias - También puede usar PUT
   */
  upsert(torneoCategoria: Partial<TorneoCategoria>): Observable<TorneoCategoria> {
    return this.http.post<any>(this.apiUrl, torneoCategoria).pipe(
      map(response => response.data || response),
      catchError(error => {
        console.error('Error en TorneoCategoriaService.upsert:', error);
        throw error;
      })
    );
  }

  /**
   * DELETE /api/torneo-categorias/torneo/:torneo_id/categoria/:categoria_id - Eliminar categoría de torneo (protegido)
   */
  delete(idTorneo: number, idCategoria: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/torneo/${idTorneo}/categoria/${idCategoria}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * PATCH /api/torneo-categorias/torneo/:torneo_id/categoria/:categoria_id/toggle - Activar/desactivar (protegido)
   */
  toggleActive(idTorneo: number, idCategoria: number, activo: boolean): Observable<TorneoCategoria> {
    return this.http.patch<any>(`${this.apiUrl}/torneo/${idTorneo}/categoria/${idCategoria}/toggle`, { activo }).pipe(
      map(response => response.data || response)
    );
  }
}