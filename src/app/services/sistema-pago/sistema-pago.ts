import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { SistemaPago } from '../../models/sistema-pago';

@Injectable({
  providedIn: 'root'
})
export class SistemaPagoService {
  private apiUrl = `${environment.apiUrl}/sistemas-pago`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/sistemas-pago/activos - Obtener sistemas de pago activos (público)
   */
  getActivos(): Observable<SistemaPago[]> {
    return this.http.get<any>(`${this.apiUrl}/activos`).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/sistemas-pago/:id - Obtener sistema de pago por ID (público)
   */
  getById(id: number): Observable<SistemaPago> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * GET /api/sistemas-pago - Obtener todos los sistemas de pago (protegido)
   */
  getAll(activo?: boolean): Observable<SistemaPago[]> {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo.toString());
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/sistemas-pago - Crear sistema de pago (protegido)
   */
  create(sistemaPago: Partial<SistemaPago>): Observable<SistemaPago> {
    return this.http.post<any>(this.apiUrl, sistemaPago).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * PUT /api/sistemas-pago/:id - Actualizar sistema de pago (protegido)
   */
  update(id: number, sistemaPago: Partial<SistemaPago>): Observable<SistemaPago> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, sistemaPago).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /api/sistemas-pago/:id - Eliminar sistema de pago (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * PATCH /api/sistemas-pago/:id/toggle - Activar/desactivar sistema de pago (protegido)
   */
  toggleActive(id: number, activo: boolean): Observable<SistemaPago> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, { activo }).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Datos inválidos';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Conflicto al eliminar el recurso';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      } else {
        errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('Error en SistemaPagoService:', error);
    return throwError(() => ({ error: { message: errorMessage }, status: error.status }));
  }
}