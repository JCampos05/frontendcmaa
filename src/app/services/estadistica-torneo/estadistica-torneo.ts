import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { EstadisticaTorneo, CargarRankingFinalDto } from '../../models/estadistica-torneo';

@Injectable({
  providedIn: 'root'
})
export class EstadisticaTorneoService {
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
        if (response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  getEstadisticasByTorneo(idTorneo: number): Observable<EstadisticaTorneo[]> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.estadisticas) return response.estadisticas;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  getEstadisticasByTorneoCategoria(idTorneo: number, idTorneoCategoria: number): Observable<EstadisticaTorneo[]> {
    const url = `${this.apiUrl}/torneo/${idTorneo}/categoria/${idTorneoCategoria}`;

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
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

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
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
        if (response.data) return response.data;
        if (response.success && response.estadistica) return response.estadistica;
        return response;
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  createEstadistica(estadistica: Partial<EstadisticaTorneo>): Observable<EstadisticaTorneo | null> {
    return this.http.post<any>(this.apiUrl, estadistica, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
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
        if (response.data) return response.data;
        if (response.success && response.estadistica) return response.estadistica;
        return response;
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  deleteEstadistica(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        return response.success || true;
      }),
      catchError(error => {
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
        if (response.data) return response.data;
        if (response.estadisticas) return response.estadisticas;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  cargarRankingFinal(data: CargarRankingFinalDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cargar-ranking`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error en cargarRankingFinal:', error);
        throw error;
      })
    );
  }

  getRankingFinal(idTorneo: number, idTorneoCategoria: number): Observable<EstadisticaTorneo[]> {
    const url = `${this.apiUrl}/ranking-final/${idTorneo}/${idTorneoCategoria}`;
    console.log('=== SERVICE getRankingFinal ===');
    console.log('URL que se llamará:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('Respuesta cruda del servidor:', response);
        if (response.success && response.data) {
          return response.data;
        }
        if (response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('✗ Error HTTP en getRankingFinal:');
        console.error('Status:', error.status);
        console.error('URL llamada:', url);
        console.error('Error completo:', error);
        throw error; // Re-lanzar el error para que lo capture el componente
      })
    );
  }
}