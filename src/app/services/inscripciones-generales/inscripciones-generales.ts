import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class InscripcionesGeneralesService {
  private apiUrl = `${environment.apiUrl}/inscripciones-generales`;

  constructor(private http: HttpClient) {}

  getResumenGeneral(periodo: 'dia' | 'semana' | 'mes' | 'anio' = 'mes'): Observable<any> {
    const params = new HttpParams().set('periodo', periodo);
    return this.http.get<any>(`${this.apiUrl}/resumen`, { params }).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  getEvolucionTemporal(periodo: 'dia' | 'semana' | 'mes' | 'anio', fechaInicio?: string, fechaFin?: string): Observable<any[]> {
    let params = new HttpParams().set('periodo', periodo);
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);

    return this.http.get<any>(`${this.apiUrl}/evolucion-temporal`, { params }).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  getResumenTorneos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen-torneos`).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
    );
  }

  getInscripcionesPorTorneo(limite: number = 10): Observable<any[]> {
    const params = new HttpParams().set('limite', limite.toString());
    return this.http.get<any>(`${this.apiUrl}/por-torneo`, { params }).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  getDistribucionCategoria(idTorneo: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/distribucion/${idTorneo}`).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  getTorneosParaSelector(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/torneos-selector`).pipe(
      map(response => response.data || response || []),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en InscripcionesGeneralesService:', error);
    return throwError(() => ({
      error: { message: error.error?.message || 'Error al obtener datos' },
      status: error.status
    }));
  }
}