import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../enviroment/enviroment';
import { Mesa, CreateMesaDto, UpdateMesaDto } from '../../models/mesa';

export interface DisponibilidadMesa {
  disponible: boolean;
  yaFinalizada: boolean;
  usuarioEditando?: string;
  tiempoRestante?: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private apiUrl = `${environment.apiUrl}/mesas`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllMesas(): Observable<Mesa[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('Error en getAllMesas:', error);
        return of([]);
      })
    );
  }

  getMesasByRonda(idRonda: number): Observable<Mesa[]> {
    return this.http.get<any>(`${this.apiUrl}/ronda/${idRonda}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.mesas) return response.mesas;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('Error en getMesasByRonda:', error);
        return of([]);
      })
    );
  }

  getMesaById(id: number): Observable<Mesa | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.mesa) return response.mesa;
        return response;
      }),
      catchError(error => {
        console.error('Error en getMesaById:', error);
        return of(null);
      })
    );
  }

  verificarDisponibilidadMesa(id: number): Observable<DisponibilidadMesa> {
    return this.http.get<any>(`${this.apiUrl}/${id}/verificar-disponibilidad`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        disponible: response.disponible || false,
        yaFinalizada: response.yaFinalizada || false,
        usuarioEditando: response.usuarioEditando,
        tiempoRestante: response.tiempoRestante,
        message: response.message || ''
      })),
      catchError(error => {
        console.error('Error en verificarDisponibilidadMesa:', error);
        return of({
          disponible: false,
          yaFinalizada: false,
          message: 'Error al verificar disponibilidad'
        });
      })
    );
  }

  createMesa(mesa: CreateMesaDto): Observable<Mesa | null> {
    return this.http.post<any>(this.apiUrl, mesa, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.mesa) return response.mesa;
        return response;
      }),
      catchError(error => {
        console.error('Error en createMesa:', error);
        return of(null);
      })
    );
  }

  updateMesa(id: number, mesa: UpdateMesaDto): Observable<Mesa | null> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, mesa, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.success && response.mesa) return response.mesa;
        return response;
      }),
      catchError(error => {
        //-> OJO daba error en cuanto se actualizaba PERO si se guarda correctamente (Pool constante con seccion critica)
        //console.error('Error en updateMesa:', error); 
        return of(null);
      })
    );
  }

  deleteMesa(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.success || true),
      catchError(error => {
        console.error('Error en deleteMesa:', error);
        return of(false);
      })
    );
  }

  bloquearMesa(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/bloquear`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        //-> OJO daba error en cuanto se actualizaba PERO si se guarda correctamente (Pool constante con seccion critica)
        //console.error('Error al bloquear mesa:', error);
        throw error;
      })
    );
  }

  liberarMesa(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/liberar`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error al liberar mesa:', error);
        return of(null);
      })
    );
  }

  // Método público para obtener mesas por ronda SIN autenticación
  getMesasByRondaPublico(idRonda: number): Observable<Mesa[]> {
    return this.http.get<any>(`${this.apiUrl}/public/ronda/${idRonda}`).pipe(
      map(response => {
        if (response.data) return response.data;
        if (response.mesas) return response.mesas;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(error => {
        console.error('Error en getMesasByRondaPublico:', error);
        return of([]);
      })
    );
  }
}