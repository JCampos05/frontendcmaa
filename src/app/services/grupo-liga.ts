import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environment/enviroment';
import { GrupoLiga } from '../models/grupoLiga';

@Injectable({
  providedIn: 'root'
})
export class GrupoLigaService {
  private apiUrl = `${environment.apiUrl}/liga/grupos`;

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
   * Función auxiliar para transformar grupo
   */
  private transformarGrupo(grupo: any): any {
    if (!grupo) return null;

    return {
      ...grupo,
      fecha_creacion: this.normalizarFecha(grupo.fecha_creacion),
      fecha_actualizacion: this.normalizarFecha(grupo.fecha_actualizacion)
    };
  }

  /**
   * GET /api/liga/grupos - Obtener todos los grupos (protegido)
   */
  getAll(params?: any): Observable<GrupoLiga[]> {
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
        return data.map((grupo: any) => this.transformarGrupo(grupo));
      })
    );
  }

  /**
   * GET /api/liga/grupos/liga/:idLiga - Obtener grupos por liga (protegido)
   */
  getByLiga(idLiga: number): Observable<GrupoLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/liga/${idLiga}`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((grupo: any) => this.transformarGrupo(grupo));
      })
    );
  }

  /**
   * GET /api/liga/grupos/:id - Obtener grupo por ID (protegido)
   */
  getById(id: number): Observable<GrupoLiga> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarGrupo(data);
      })
    );
  }

  /**
   * GET /api/liga/grupos/:id/tabla - Obtener tabla de posiciones (protegido)
   */
  getTabla(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/tabla`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/liga/grupos - Crear grupo (protegido)
   */
  create(grupo: Partial<GrupoLiga>): Observable<GrupoLiga> {
    return this.http.post<any>(this.apiUrl, grupo).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarGrupo(data);
      })
    );
  }

  /**
   * PUT /api/liga/grupos/:id - Actualizar grupo (protegido)
   */
  update(id: number, grupo: Partial<GrupoLiga>): Observable<GrupoLiga> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, grupo).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarGrupo(data);
      })
    );
  }

  /**
   * DELETE /api/liga/grupos/:id - Eliminar grupo (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
 * GET /api/liga/grupos/liga/:idLiga/publico - Obtener grupos por liga (público)
 */
  getByLigaPublico(idLiga: number): Observable<GrupoLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/liga/${idLiga}/publico`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((grupo: any) => this.transformarGrupo(grupo));
      })
    );
  }

  /**
   * GET /api/liga/grupos/:id/tabla/publico - Obtener tabla de posiciones (público)
   */
  getTablaPublico(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/tabla/publico`).pipe(
      map(response => response.data || response)
    );
  }
}

