import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { InfoLiga } from '../../models/infoLiga';

@Injectable({
  providedIn: 'root'
})
export class InfoLigaService {
  private apiUrl = `${environment.apiUrl}/liga/info`;

  constructor(private http: HttpClient) { }

  /**
   * Función auxiliar para normalizar fechas
   */
  private normalizarFecha(fecha: string | Date | null | undefined): Date | null {
    if (!fecha) return null;
    
    if (typeof fecha === 'string') {
      const fechaSolo = fecha.split('T')[0];
      const [year, month, day] = fechaSolo.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    return new Date(fecha);
  }

  /**
   * Función auxiliar para transformar liga
   */
  private transformarLiga(liga: any): any {
    if (!liga) return null;
    
    return {
      ...liga,
      fecha_inicio: this.normalizarFecha(liga.fecha_inicio),
      fecha_fin: this.normalizarFecha(liga.fecha_fin),
      cierre_inscripciones: this.normalizarFecha(liga.cierre_inscripciones),
      fecha_creacion: this.normalizarFecha(liga.fecha_creacion),
      fecha_actualizacion: this.normalizarFecha(liga.fecha_actualizacion)
    };
  }

  /**
   * GET /api/liga/info - Obtener todas las ligas (protegido)
   */
  getAll(params?: any): Observable<InfoLiga[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((liga: any) => this.transformarLiga(liga));
      })
    );
  }

  /**
   * GET /api/liga/info/:id - Obtener liga por ID (protegido)
   */
  getById(id: number): Observable<InfoLiga> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarLiga(data);
      })
    );
  }

  /**
   * GET /api/liga/info/:id/stats - Obtener estadísticas de una liga (protegido)
   */
  getStats(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/stats`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/liga/info - Crear liga (protegido)
   */
  create(liga: Partial<InfoLiga>): Observable<InfoLiga> {
    return this.http.post<any>(this.apiUrl, liga).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarLiga(data);
      })
    );
  }

  /**
   * PUT /api/liga/info/:id - Actualizar liga (protegido)
   */
  update(id: number, liga: Partial<InfoLiga>): Observable<InfoLiga> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, liga).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarLiga(data);
      })
    );
  }

  /**
   * DELETE /api/liga/info/:id - Eliminar liga (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}