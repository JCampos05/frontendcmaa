import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { Categoria } from '../../models/categoria';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/categorias - Obtener todas las categorías (público)
   */
  getAll(): Observable<Categoria[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        if (response.data && Array.isArray(response.data)) return response.data;
        return [];
      }),
      catchError(error => {
        console.error('Error al cargar categorías:', error);
        return of([]);
      })
    );
  }

  /**
   * GET /api/categorias/:id - Obtener categoría por ID (público)
   */
  getById(id: number): Observable<Categoria> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/categorias - Crear categoría (protegido)
   */
  create(categoria: Partial<Categoria>): Observable<Categoria> {
    return this.http.post<any>(this.apiUrl, categoria).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * PUT /api/categorias/:id - Actualizar categoría (protegido)
   */
  update(id: number, categoria: Partial<Categoria>): Observable<Categoria> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, categoria).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * DELETE /api/categorias/:id - Eliminar categoría (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}