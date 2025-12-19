import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { EstadisticaTorneo } from '../../models/estadistica-torneo';

@Injectable({
  providedIn: 'root'
})
export class EstadisticaTorneoService {
  // Corregido: La ruta del backend es /api/estadisticas
  private apiUrl = `${environment.apiUrl}/estadisticas`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllEstadisticas(): Observable<EstadisticaTorneo[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        //console.log('getAllEstadisticas response:', response);
        if (response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        //console.error('Error en getAllEstadisticas:', error);
        return of([]);
      })
    );
  }

  getEstadisticasByTorneo(idTorneo: number): Observable<EstadisticaTorneo[]> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        //console.log('getEstadisticasByTorneo response:', response);
        if (response.data) return response.data;
        if (response.estadisticas) return response.estadisticas;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        //console.error('Error en getEstadisticasByTorneo:', error);
        return of([]);
      })
    );
  }

  getEstadisticasByTorneoCategoria(idTorneo: number, idTorneoCategoria: number): Observable<EstadisticaTorneo[]> {
    const url = `${this.apiUrl}/torneo/${idTorneo}/categoria/${idTorneoCategoria}`;
    //console.log('Llamando a URL:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        //console.log('getEstadisticasByTorneoCategoria response:', response);

        // El backend retorna { success: true, data: [...] }
        if (response.success && response.data) {
          return response.data;
        }
        if (response.data) return response.data;
        if (response.estadisticas) return response.estadisticas;
        if (Array.isArray(response)) return response;

        return [];
      }),
      catchError(error => {
        console.error('Error en getEstadisticasByTorneoCategoria:', error);
        console.error('URL:', url);
        console.error('Status:', error.status);
        return of([]);
      })
    );
  }

  getEstadisticasByTorneoCategoriaHastaRonda(
    idTorneo: number,
    idTorneoCategoria: number,
    numeroRonda: number
  ): Observable<EstadisticaTorneo[]> {
    const url = `${this.apiUrl}/torneo/${idTorneo}/categoria/${idTorneoCategoria}/ronda/${numeroRonda}`;
    //console.log('Llamando a URL (hasta ronda):', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        //console.log('getEstadisticasByTorneoCategoriaHastaRonda response:', response);

        if (response.success && response.data) {
          return response.data;
        }
        if (response.data) return response.data;
        if (Array.isArray(response)) return response;

        return [];
      }),
      catchError(error => {
        console.error('Error en getEstadisticasByTorneoCategoriaHastaRonda:', error);
        return of([]);
      })
    );
  }

  getEstadisticaByJugador(idJugador: number, idTorneo: number): Observable<EstadisticaTorneo | null> {
    return this.http.get<any>(
      `${this.apiUrl}/jugador/${idJugador}/torneo/${idTorneo}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        //console.log('getEstadisticaByJugador response:', response);
        if (response.data) return response.data;
        if (response.success && response.estadistica) return response.estadistica;
        return response;
      }),
      catchError(error => {
        //console.error('Error en getEstadisticaByJugador:', error);
        return of(null);
      })
    );
  }

  createEstadistica(estadistica: Partial<EstadisticaTorneo>): Observable<EstadisticaTorneo | null> {
    return this.http.post<any>(this.apiUrl, estadistica, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        //console.log('createEstadistica response:', response);
        if (response.data) return response.data;
        if (response.success && response.estadistica) return response.estadistica;
        return response;
      }),
      catchError(error => {
        console.error('Error en createEstadistica:', error);
        return of(null);
      })
    );
  }

  updateEstadistica(id: number, estadistica: Partial<EstadisticaTorneo>): Observable<EstadisticaTorneo | null> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, estadistica, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        //console.log('updateEstadistica response:', response);
        if (response.data) return response.data;
        if (response.success && response.estadistica) return response.estadistica;
        return response;
      }),
      catchError(error => {
        //console.error('Error en updateEstadistica:', error);
        return of(null);
      })
    );
  }

  deleteEstadistica(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        //console.log('deleteEstadistica response:', response);
        return response.success || true;
      }),
      catchError(error => {
        //console.error('Error en deleteEstadistica:', error);
        return of(false);
      })
    );
  }

  recalcularPosiciones(idTorneo: number, idTorneoCategoria: number): Observable<EstadisticaTorneo[]> {
    return this.http.put<any>(
      `${this.apiUrl}/recalcular/${idTorneo}/${idTorneoCategoria}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        //console.log('recalcularPosiciones response:', response);
        if (response.data) return response.data;
        if (response.estadisticas) return response.estadisticas;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        //console.error('Error en recalcularPosiciones:', error);
        return of([]);
      })
    );
  }
}