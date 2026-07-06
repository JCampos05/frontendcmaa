import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../enviroment/enviroment';
import { PartidaLiga } from '../models/partidaLiga';

@Injectable({
  providedIn: 'root'
})
export class PartidaLigaService {
  private apiUrl = `${environment.apiUrl}/liga/partidas`;

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
   * Función auxiliar para transformar partida
   */
  private transformarPartida(partida: any): any {
    if (!partida) return null;
    
    return {
      ...partida,
      fecha_finalizacion: this.normalizarFecha(partida.fecha_finalizacion)
    };
  }

  /**
   * GET /api/liga/partidas - Obtener todas las partidas (protegido)
   */
  getAll(params?: any): Observable<PartidaLiga[]> {
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
        return data.map((partida: any) => this.transformarPartida(partida));
      })
    );
  }

  /**
   * GET /api/liga/partidas/:id - Obtener partida por ID (protegido)
   */
  getById(id: number): Observable<PartidaLiga> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarPartida(data);
      })
    );
  }

  /**
   * POST /api/liga/partidas - Crear partida (protegido)
   */
  create(partida: Partial<PartidaLiga>): Observable<PartidaLiga> {
    return this.http.post<any>(this.apiUrl, partida).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarPartida(data);
      })
    );
  }

  /**
   * PUT /api/liga/partidas/:id - Actualizar partida (protegido)
   */
  update(id: number, partida: Partial<PartidaLiga>): Observable<PartidaLiga> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, partida).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarPartida(data);
      })
    );
  }

  /**
   * DELETE /api/liga/partidas/:id - Eliminar partida (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}

