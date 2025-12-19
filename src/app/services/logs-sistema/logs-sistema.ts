import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { LogSistema, EstadisticasLogs } from '../../models/log-sistema';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
  pagina?: number;
  totalPaginas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogsSistemaService {
  private apiUrl = `${environment.apiUrl}/logs`;

  constructor(private http: HttpClient) {}

  getAll(
    limite: number = 100,
    pagina: number = 1,
    filtros?: {
      nivel?: string;
      entidad?: string;
      accion?: string;
      idUsuario?: number;
      fechaInicio?: string;
      fechaFin?: string;
    }
  ): Observable<{ data: LogSistema[]; total: number; pagina: number; totalPaginas: number }> {
    let params = new HttpParams()
      .set('limite', limite.toString())
      .set('pagina', pagina.toString());

    if (filtros) {
      if (filtros.nivel) params = params.set('nivel', filtros.nivel);
      if (filtros.entidad) params = params.set('entidad', filtros.entidad);
      if (filtros.accion) params = params.set('accion', filtros.accion);
      if (filtros.idUsuario) params = params.set('idUsuario', filtros.idUsuario.toString());
      if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<ApiResponse<LogSistema[]>>(this.apiUrl, { params }).pipe(
      map(response => ({
        data: response.data,
        total: response.total || 0,
        pagina: response.pagina || 1,
        totalPaginas: response.totalPaginas || 1
      }))
    );
  }

  getEstadisticas(filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<EstadisticasLogs> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<ApiResponse<EstadisticasLogs>>(
      `${this.apiUrl}/estadisticas`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  getByEntidad(entidad: string, idEntidad: number): Observable<LogSistema[]> {
    return this.http.get<ApiResponse<LogSistema[]>>(
      `${this.apiUrl}/${entidad}/${idEntidad}`
    ).pipe(
      map(response => response.data)
    );
  }
}