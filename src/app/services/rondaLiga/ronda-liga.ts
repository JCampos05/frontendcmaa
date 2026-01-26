import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { RondaLiga } from '../../models/rondaLiga';

@Injectable({
  providedIn: 'root'
})
export class RondaLigaService {
  private apiUrl = `${environment.apiUrl}/liga/rondas`;

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
   * Función auxiliar para transformar ronda
   */
  private transformarRonda(ronda: any): any {
    if (!ronda) return null;

    return {
      ...ronda,
      fecha_programada: this.normalizarFecha(ronda.fecha_programada),
      fecha_inicio: this.normalizarFecha(ronda.fecha_inicio),
      fecha_fin: this.normalizarFecha(ronda.fecha_fin),
      fecha_creacion: this.normalizarFecha(ronda.fecha_creacion),
      fecha_actualizacion: this.normalizarFecha(ronda.fecha_actualizacion)
    };
  }

  /**
   * GET /api/liga/rondas - Obtener todas las rondas (protegido)
   */
  getAll(params?: any): Observable<RondaLiga[]> {
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
        return data.map((ronda: any) => this.transformarRonda(ronda));
      })
    );
  }

  /**
   * GET /api/liga/rondas/liga/:idLiga - Obtener rondas por liga (protegido)
   */
  getByLiga(idLiga: number): Observable<RondaLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/liga/${idLiga}`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((ronda: any) => this.transformarRonda(ronda));
      })
    );
  }

  /**
   * GET /api/liga/rondas/grupo/:idGrupo - Obtener rondas por grupo (protegido)
   */
  getByGrupo(idGrupo: number): Observable<RondaLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/grupo/${idGrupo}`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((ronda: any) => this.transformarRonda(ronda));
      })
    );
  }

  /**
   * GET /api/liga/rondas/:id - Obtener ronda por ID (protegido)
   */
  getById(id: number): Observable<RondaLiga> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarRonda(data);
      })
    );
  }

  /**
   * POST /api/liga/rondas - Crear ronda (protegido)
   */
  create(ronda: Partial<RondaLiga>): Observable<RondaLiga> {
    return this.http.post<any>(this.apiUrl, ronda).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarRonda(data);
      })
    );
  }

  /**
   * PUT /api/liga/rondas/:id - Actualizar ronda (protegido)
   */
  update(id: number, ronda: Partial<RondaLiga>): Observable<RondaLiga> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, ronda).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarRonda(data);
      })
    );
  }

  /**
   * PUT /api/liga/rondas/:id/iniciar - Iniciar ronda (protegido)
   */
  iniciar(id: number): Observable<RondaLiga> {
    return this.http.put<any>(`${this.apiUrl}/${id}/iniciar`, {}).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarRonda(data);
      })
    );
  }

  /**
   * PUT /api/liga/rondas/:id/finalizar - Finalizar ronda (protegido)
   */
  finalizar(id: number): Observable<RondaLiga> {
    return this.http.put<any>(`${this.apiUrl}/${id}/finalizar`, {}).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarRonda(data);
      })
    );
  }

  /**
   * DELETE /api/liga/rondas/:id - Eliminar ronda (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
 * GET /api/liga/rondas/liga/:idLiga/publico - Obtener rondas por liga (público)
 */
  getByLigaPublico(idLiga: number): Observable<RondaLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/liga/${idLiga}/publico`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((ronda: any) => this.transformarRonda(ronda));
      })
    );
  }

  /**
   * GET /api/liga/rondas/grupo/:idGrupo/publico - Obtener rondas por grupo (público)
   */
  getByGrupoPublico(idGrupo: number): Observable<RondaLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/grupo/${idGrupo}/publico`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((ronda: any) => this.transformarRonda(ronda));
      })
    );
  }
}