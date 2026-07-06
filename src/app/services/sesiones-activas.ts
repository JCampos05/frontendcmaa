import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../enviroment/enviroment';
import { SesionActiva } from '../models/sesion-activa';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  sesionesCerradas?: number;
  sesionesLimpiadas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SesionesActivasService {
  private apiUrl = `${environment.apiUrl}/sesiones`;

  constructor(private http: HttpClient) {}

  getActivas(): Observable<SesionActiva[]> {
    return this.http.get<ApiResponse<SesionActiva[]>>(`${this.apiUrl}/activas`).pipe(
      map(response => response.data || [])
    );
  }

  getByUsuario(idUsuario: number): Observable<SesionActiva[]> {
    return this.http.get<ApiResponse<SesionActiva[]>>(
      `${this.apiUrl}/usuario/${idUsuario}`
    ).pipe(
      map(response => response.data || [])
    );
  }

  cerrarSesion(idSesion: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${idSesion}`).pipe(
      map(() => undefined)
    );
  }

  cerrarTodasUsuario(idUsuario: number, confirmar: boolean = false): Observable<number> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/usuario/${idUsuario}/cerrar-todas`,
      { confirmar }
    ).pipe(
      map(response => response.sesionesCerradas || 0)
    );
  }

  limpiarExpiradas(): Observable<number> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/limpiar-expiradas`,
      {}
    ).pipe(
      map(response => response.sesionesLimpiadas || 0)
    );
  }
}

