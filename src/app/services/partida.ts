import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../enviroment/enviroment';
import { Partida, CreatePartidaDto, UpdatePartidaDto } from '../models/partida';

@Injectable({
  providedIn: 'root'
})
export class PartidaService {
  private apiUrl = `${environment.apiUrl}/partidas`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllPartidas(): Observable<Partida[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('Error en getAllPartidas:', error);
        return of([]);
      })
    );
  }

  getPartidaById(id: number): Observable<Partida | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.partida) return response.partida;
        return response;
      }),
      catchError(error => {
        console.error('Error en getPartidaById:', error);
        return of(null);
      })
    );
  }

  getPartidasByJugadorTorneo(idJugador: number, idTorneo: number): Observable<Partida[]> {
    return this.http.get<any>(`${this.apiUrl}/jugador/${idJugador}/torneo/${idTorneo}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('Error en getPartidasByJugadorTorneo:', error);
        return of([]);
      })
    );
  }

  createPartida(partida: CreatePartidaDto): Observable<Partida | null> {
    return this.http.post<any>(this.apiUrl, partida, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.partida) return response.partida;
        return response;
      }),
      catchError(error => {
        console.error('Error en createPartida:', error);
        return of(null);
      })
    );
  }

  updatePartida(id: number, partida: UpdatePartidaDto): Observable<Partida | null> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, partida, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.partida) return response.partida;
        return response;
      }),
      catchError(error => {
        console.error('Error en updatePartida:', error);
        return of(null);
      })
    );
  }

  deletePartida(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => response.success || true),
      catchError(error => {
        console.error('Error en deletePartida:', error);
        return of(false);
      })
    );
  }
}

