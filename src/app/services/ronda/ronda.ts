import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { Ronda, CreateRondaDto, UpdateRondaDto } from '../../models/ronda';

@Injectable({
  providedIn: 'root'
})
export class RondaService {
  private apiUrl = `${environment.apiUrl}/rondas`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllRondas(): Observable<Ronda[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('Error en getAllRondas:', error);
        return of([]);
      })
    );
  }

  getRondasByTorneo(idTorneo: number): Observable<Ronda[]> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        // Normalizar la respuesta para siempre devolver un array
        if (response.data) return response.data;
        if (response.rondas) return response.rondas;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('Error en getRondasByTorneo:', error);
        return of([]);
      })
    );
  }

  getRondasByTorneoCategoria(idTorneo: number, idTorneoCategoria: number): Observable<Ronda[]> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}/categoria/${idTorneoCategoria}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.rondas) return response.rondas;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('Error en getRondasByTorneoCategoria:', error);
        return of([]);
      })
    );
  }

  getRondaById(id: number): Observable<Ronda | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.ronda) return response.ronda;
        return response;
      }),
      catchError(error => {
        console.error('Error en getRondaById:', error);
        return of(null);
      })
    );
  }

  createRonda(ronda: CreateRondaDto): Observable<Ronda | null> {
    return this.http.post<any>(this.apiUrl, ronda, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.ronda) return response.ronda;
        return response;
      }),
      catchError(error => {
        console.error('Error en createRonda:', error);
        return of(null);
      })
    );
  }

  updateRonda(id: number, ronda: UpdateRondaDto): Observable<Ronda | null> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, ronda, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.ronda) return response.ronda;
        return response;
      }),
      catchError(error => {
        console.error('Error en updateRonda:', error);
        return of(null);
      })
    );
  }

  deleteRonda(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.success || true),
      catchError(error => {
        console.error('Error en deleteRonda:', error);
        return of(false);
      })
    );
  }
}