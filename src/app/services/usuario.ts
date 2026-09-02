import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environment/enviroment';
import { Usuario } from '../models/usuario';
import { Torneo } from '../models/torneo';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  getAll(orden: string = 'fecha_registro', direccion: string = 'DESC'): Observable<Usuario[]> {
    return this.http.get<ApiResponse<Usuario[]>>(
      `${this.apiUrl}?orden=${orden}&direccion=${direccion}`
    ).pipe(
      map(response => response.data)
    );
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  create(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<ApiResponse<Usuario>>(this.apiUrl, usuario).pipe(
      map(response => response.data)
    );
  }

  update(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/${id}`, usuario).pipe(
      map(response => response.data)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  cambiarPassword(id: number, passwordActual: string, passwordNuevo: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(
      `${this.apiUrl}/${id}/cambiar-password`,
      { passwordActual, passwordNuevo }
    ).pipe(
      map(() => undefined)
    );
  }

  getTorneosAsignados(id: number): Observable<Torneo[]> {
    return this.http.get<ApiResponse<Torneo[]>>(`${this.apiUrl}/${id}/torneos`).pipe(
      map(response => response.data || [])
    );
  }
}

