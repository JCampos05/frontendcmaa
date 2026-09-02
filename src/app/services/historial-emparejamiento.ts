import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/enviroment';
import { HistorialEmparejamiento, CreateHistorialDto, CreateHistorialRondaDto } from '../models/historial-emparejamiento';

@Injectable({
  providedIn: 'root'
})
export class HistorialEmparejamientoService {
  private apiUrl = `${environment.apiUrl}/historial-emparejamientos`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllHistorial(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() });
  }

  getHistorialByTorneo(idTorneo: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/torneo/${idTorneo}`, { headers: this.getHeaders() });
  }

  getHistorialByJugador(idJugador: number, idTorneo: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/jugador/${idJugador}/torneo/${idTorneo}`, { headers: this.getHeaders() });
  }

  verificarEnfrentamiento(idJugador1: number, idJugador2: number, idTorneo: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verificar/${idJugador1}/${idJugador2}/${idTorneo}`, { headers: this.getHeaders() });
  }

  createHistorial(historial: CreateHistorialDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, historial, { headers: this.getHeaders() });
  }

  createHistorialRonda(historialRonda: CreateHistorialRondaDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ronda`, historialRonda, { headers: this.getHeaders() });
  }

  deleteHistorial(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}

