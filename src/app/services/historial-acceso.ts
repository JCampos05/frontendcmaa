import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../enviroment/enviroment';
import { HistorialAcceso, EstadisticasAcceso } from '../models/historial-acceso';

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
export class HistorialAccesoService {
  private apiUrl = `${environment.apiUrl}/historial-accesos`;

  constructor(private http: HttpClient) {}

  getAll(
    limite: number = 100,
    pagina: number = 1,
    filtros?: {
      tipo?: string;
      idUsuario?: number;
      fechaInicio?: string;
      fechaFin?: string;
    }
  ): Observable<{ data: HistorialAcceso[]; total: number; pagina: number; totalPaginas: number }> {
    let params = new HttpParams()
      .set('limite', limite.toString())
      .set('pagina', pagina.toString());

    if (filtros) {
      if (filtros.tipo) params = params.set('tipo', filtros.tipo);
      if (filtros.idUsuario) params = params.set('idUsuario', filtros.idUsuario.toString());
      if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<ApiResponse<HistorialAcceso[]>>(this.apiUrl, { params }).pipe(
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
  }): Observable<EstadisticasAcceso> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<ApiResponse<EstadisticasAcceso>>(
      `${this.apiUrl}/estadisticas`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }
}

