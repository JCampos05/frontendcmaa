import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasPagoService {
  private apiUrl = `${environment.apiUrl}/estadisticas-pago`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener estadísticas generales de pagos
   */
  getEstadisticasGenerales(fechaInicio?: string, fechaFin?: string, torneoId?: number | null): Observable<any> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    if (torneoId) params = params.set('idTorneo', torneoId.toString());

    return this.http.get<any>(`${this.apiUrl}/generales`, { params }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtener estadísticas por categoría
   */
  getEstadisticasPorCategoria(fechaInicio?: string, fechaFin?: string, torneoId?: number | null): Observable<any[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    if (torneoId) params = params.set('idTorneo', torneoId.toString());

    return this.http.get<any>(`${this.apiUrl}/por-categoria`, { params }).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * Obtener estadísticas por torneo
   */
  getEstadisticasPorTorneo(fechaInicio?: string, fechaFin?: string, torneoId?: number | null): Observable<any[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    if (torneoId) params = params.set('idTorneo', torneoId.toString());

    return this.http.get<any>(`${this.apiUrl}/por-torneo`, { params }).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * Obtener evolución temporal
   */
  getEvolucionTemporal(fechaInicio?: string, fechaFin?: string, agrupacion: 'dia' | 'semana' | 'mes' | 'anio' = 'mes', torneoId?: number | null): Observable<any[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    params = params.set('agrupacion', agrupacion);
    if (torneoId) params = params.set('idTorneo', torneoId.toString());

    return this.http.get<any>(`${this.apiUrl}/evolucion`, { params }).pipe(
      map(response => response.data || response || [])
    );
  }

  /**
   * Obtener comparativa anual
   */
  getComparativaAnual(torneoId?: number | null): Observable<any[]> {
    let params = new HttpParams();
    if (torneoId !== null && torneoId !== undefined) params = params.set('idTorneo', torneoId.toString());

    return this.http.get<any>(`${this.apiUrl}/comparativa-anual`, { params }).pipe(
      map(response => response.data || response || [])
    );
  }

  getTorneos(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/torneos`).pipe(
      map(response => {
        const torneos = response.data || response || [];
        return torneos.map((t: any) => {
          const fecha = t.fecha_inicio || t.fecha;
          // Si la fecha viene en formato YYYY-MM-DD, agregarle hora local para evitar conversión UTC
          const fechaCorregida = fecha && fecha.includes('T') ? fecha : `${fecha}T00:00:00`;
          return {
            ...t,
            fecha_inicio: fechaCorregida
          };
        });
      })
    );
  }
  /**
   * Exportar reporte en formato específico
   */
  exportarReporte(formato: 'pdf' | 'excel', datos: any): void {
    // Este método se implementará en el componente para generar los reportes
    //console.log(`Exportando reporte en formato ${formato}`, datos);
  }
}