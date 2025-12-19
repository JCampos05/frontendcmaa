import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { Jugador } from '../../models/jugador';

@Injectable({
  providedIn: 'root'
})
export class JugadorService {
  private apiUrl = `${environment.apiUrl}/jugadores`;

  constructor(private http: HttpClient) { }

  /**
   * GET /api/jugadores - Obtener todos los jugadores (protegido)
   * Acepta parámetros de filtrado opcionales
   */
  getAll(params?: any): Observable<Jugador[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * GET /api/jugadores/stats - Obtener estadísticas de jugadores (protegido)
   */
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * GET /api/jugadores/:id - Obtener jugador por ID (protegido)
   */
  getById(id: number): Observable<Jugador> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/jugadores - Crear jugador (protegido)
   */
  create(jugador: Partial<Jugador>): Observable<Jugador> {
    return this.http.post<any>(this.apiUrl, jugador).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * PUT /api/jugadores/:id - Actualizar jugador (protegido)
   */
  update(id: number, jugador: Partial<Jugador>): Observable<Jugador> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, jugador).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * DELETE /api/jugadores/:id - Eliminar jugador (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
 * GET /api/jugadores/search - Buscar jugadores por nombre (público)
 */
  search(nombre?: string, apellido1?: string, apellido2?: string): Observable<Jugador[]> {
    let params = new HttpParams();
    if (nombre) params = params.set('nombre', nombre);
    if (apellido1) params = params.set('apellido1', apellido1);
    if (apellido2) params = params.set('apellido2', apellido2);

    return this.http.get<any>(`${this.apiUrl}/search`, { params }).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * GET /api/jugadores/:id/stats - Obtener estadísticas públicas de un jugador
   */
  getPublicStats(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/stats`).pipe(
      map(response => response.data || response)
    );
  }
  /**
   * GET /api/jugadores/:id/full - Obtener jugador completo con todas las relaciones (protegido)
   */
  getFullById(id: number): Observable<Jugador> {
    return this.http.get<any>(`${this.apiUrl}/${id}/full`).pipe(
      map(response => {
        const data = response.data || response;
        console.log('Datos recibidos en getFullById:', data);
        return data;
      })
    );
  }
}