import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environment/enviroment';
import { RitmoJuego } from '../models/ritmo-juego';

@Injectable({
  providedIn: 'root'
})
export class RitmoJuegoService {
  private apiUrl = `${environment.apiUrl}/ritmos-juego`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/ritmos-juego - Obtener todos los ritmos (público)
   */
  getAll(activo?: boolean): Observable<RitmoJuego[]> {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo.toString());
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        if (response.data && Array.isArray(response.data)) return response.data;
        return [];
      }),
      catchError(error => {
        console.error('Error al cargar ritmos de juego:', error);
        return of([]);
      })
    );
  }

  /**
   * GET /api/ritmos-juego/:id - Obtener ritmo por ID (público)
   */
  getById(id: number): Observable<RitmoJuego> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/ritmos-juego - Crear ritmo (protegido)
   */
  create(ritmo: Partial<RitmoJuego>): Observable<RitmoJuego> {
    return this.http.post<any>(this.apiUrl, ritmo).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * PUT /api/ritmos-juego/:id - Actualizar ritmo (protegido)
   */
  update(id: number, ritmo: Partial<RitmoJuego>): Observable<RitmoJuego> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, ritmo).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * DELETE /api/ritmos-juego/:id - Eliminar ritmo (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}

