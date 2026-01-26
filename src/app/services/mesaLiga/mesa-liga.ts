import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { MesaLiga } from '../../models/mesaLiga';

@Injectable({
  providedIn: 'root'
})
export class MesaLigaService {
  private apiUrl = `${environment.apiUrl}/liga/mesas`;

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
   * Función auxiliar para transformar mesa
   */
  private transformarMesa(mesa: any): any {
    if (!mesa) return null;
    
    return {
      ...mesa,
      fecha_creacion: this.normalizarFecha(mesa.fecha_creacion),
      timestampEdicion: this.normalizarFecha(mesa.timestampEdicion)
    };
  }

  /**
   * GET /api/liga/mesas - Obtener todas las mesas (protegido)
   */
  getAll(params?: any): Observable<MesaLiga[]> {
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
        return data.map((mesa: any) => this.transformarMesa(mesa));
      })
    );
  }

  /**
   * GET /api/liga/mesas/ronda/:idRonda - Obtener mesas por ronda (protegido)
   */
  getByRonda(idRonda: number): Observable<MesaLiga[]> {
    return this.http.get<any>(`${this.apiUrl}/ronda/${idRonda}`).pipe(
      map(response => {
        const data = response.data || response || [];
        return data.map((mesa: any) => this.transformarMesa(mesa));
      })
    );
  }

  /**
   * GET /api/liga/mesas/:id - Obtener mesa por ID (protegido)
   */
  getById(id: number): Observable<MesaLiga> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarMesa(data);
      })
    );
  }

  /**
   * POST /api/liga/mesas - Crear mesa (protegido)
   */
  create(mesa: Partial<MesaLiga>): Observable<MesaLiga> {
    return this.http.post<any>(this.apiUrl, mesa).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarMesa(data);
      })
    );
  }

  /**
   * PUT /api/liga/mesas/:id - Actualizar mesa (protegido)
   */
  update(id: number, mesa: Partial<MesaLiga>): Observable<MesaLiga> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, mesa).pipe(
      map(response => {
        const data = response.data || response;
        return this.transformarMesa(data);
      })
    );
  }

  /**
   * POST /api/liga/mesas/:id/finalizar - Finalizar partida (protegido)
   */
  finalizarPartida(id: number, datos: {
    resultado: string;
    tipo_finalizacion?: string;
    descripcion_finalizacion?: string;
    duracion_minutos?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/finalizar`, datos).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * DELETE /api/liga/mesas/:id - Eliminar mesa (protegido)
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}