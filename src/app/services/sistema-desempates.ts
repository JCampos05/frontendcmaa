import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environment/enviroment';
import { SistemaDesempate } from '../models/sistema-desempates';

@Injectable({
  providedIn: 'root'
})
export class SistemaDesempateService {
  private apiUrl = `${environment.apiUrl}/sistemas-desempate`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/sistemas-desempate - Obtener todos los sistemas (público)
   */
  getAll(activo?: boolean): Observable<SistemaDesempate[]> {
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
        console.error('Error al cargar sistemas de desempate:', error);
        return of([]);
      })
    );
  }

  /**
   * GET /api/sistemas-desempate/:id - Obtener sistema por ID (público)
   */
  getById(id: number): Observable<SistemaDesempate> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/sistemas-desempate - Crear sistema (protegido)
   */
  create(sistema: Partial<SistemaDesempate>): Observable<SistemaDesempate> {
    return this.http.post<any>(this.apiUrl, sistema).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * PUT /api/sistemas-desempate/:id - Actualizar sistema (protegido)
   */
  update(id: number, sistema: Partial<SistemaDesempate>): Observable<SistemaDesempate> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, sistema).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * DELETE /api/sistemas-desempate/:id - Eliminar sistema (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}

