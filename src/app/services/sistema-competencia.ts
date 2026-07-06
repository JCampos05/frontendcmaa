import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../enviroment/enviroment';
import { SistemaCompetencia } from '../models/sistema-competencia';

@Injectable({
  providedIn: 'root'
})
export class SistemaCompetenciaService {
  private apiUrl = `${environment.apiUrl}/sistemas-competencia`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/sistemas-competencia - Obtener todos los sistemas (público)
   */
  getAll(activo?: boolean): Observable<SistemaCompetencia[]> {
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
        console.error('Error al cargar sistemas de competencia:', error);
        return of([]);
      })
    );
  }

  /**
   * GET /api/sistemas-competencia/:id - Obtener sistema por ID (público)
   */
  getById(id: number): Observable<SistemaCompetencia> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/sistemas-competencia - Crear sistema (protegido)
   */
  create(sistema: Partial<SistemaCompetencia>): Observable<SistemaCompetencia> {
    return this.http.post<any>(this.apiUrl, sistema).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * PUT /api/sistemas-competencia/:id - Actualizar sistema (protegido)
   */
  update(id: number, sistema: Partial<SistemaCompetencia>): Observable<SistemaCompetencia> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, sistema).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * DELETE /api/sistemas-competencia/:id - Eliminar sistema (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}

