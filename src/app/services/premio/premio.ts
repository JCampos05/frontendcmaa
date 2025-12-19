import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { Premio } from '../../models/premio';

@Injectable({
  providedIn: 'root'
})
export class PremioService {
  private apiUrl = `${environment.apiUrl}/premios`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/premios/torneo/:torneo_id - Obtener premios por torneo (público)
   */
  getByTorneo(idTorneo: number): Observable<Premio[]> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}`).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * GET /api/premios/:id - Obtener premio por ID (público)
   */
  getById(id: number): Observable<Premio> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * GET /api/premios - Obtener todos los premios (protegido)
   */
  getAll(): Observable<Premio[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * POST /api/premios - Crear premio (protegido)
   */
  create(premio: Partial<Premio>): Observable<Premio> {
    return this.http.post<any>(this.apiUrl, premio).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * PUT /api/premios/:id - Actualizar premio (protegido)
   */
  update(id: number, premio: Partial<Premio>): Observable<Premio> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, premio).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * DELETE /api/premios/:id - Eliminar premio (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}