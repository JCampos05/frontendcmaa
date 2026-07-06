import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../enviroment/enviroment';
import { Usuario } from '../models/usuario';

interface LoginResponse {
  ok: boolean;
  mensaje: string;
  data: {
    usuario: Usuario;
    token: string;
    idSesion?: number;
  };
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: Usuario;
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;
  private isLoggingOut = false; // Flag para prevenir múltiples logout

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * POST /api/auth/login
   */
  login(telefono: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { telefono, password })
      .pipe(
        tap(response => {
          //console.log('✅ Login response:', response);
          if (response.ok && response.data) {
            const { token, usuario } = response.data;
            //console.log('📝 Token recibido:', token ? '✅ SÍ' : '❌ NO');
            //console.log('👤 Usuario:', usuario);

            // Guardar en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('currentUser', JSON.stringify(usuario));

            // Actualizar el subject
            this.currentUserSubject.next(usuario);

            // IMPORTANTE: Emitir evento para iniciar monitoreo de sesión
            window.dispatchEvent(new CustomEvent('session-started'));
          }
        })
      );
  }

  /**
   * POST /api/auth/register
   */
  register(usuario: Partial<Usuario>): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, usuario);
  }

  /**
   * GET /api/auth/profile
   * Ruta protegida - requiere token
   */
  getProfile(): Observable<Usuario> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * POST /api/auth/logout
   * Cerrar sesión en el backend y localmente
   */
  logout(): Observable<LogoutResponse> {
    // Prevenir múltiples logout simultáneos
    if (this.isLoggingOut) {
      //console.warn('⚠️ Ya hay un logout en progreso');
      return of({ success: true, message: 'Cerrando sesión...' });
    }

    this.isLoggingOut = true;

    // Si no hay token, solo limpiar localmente
    const token = this.getToken();
    if (!token) {
      this.logoutLocal();
      this.isLoggingOut = false;
      return of({ success: true, message: 'Sesión cerrada localmente' });
    }

    
    return this.http.post<LogoutResponse>(`${this.apiUrl}/logout`, {}).pipe(
      tap(response => {
        // SIEMPRE limpiar localStorage después de la respuesta
        this.logoutLocal();
      }),
      catchError(error => {
        // Aunque falle el backend, limpiar localmente
        //console.error('❌ Error al cerrar sesión en el backend:', error);
        this.logoutLocal();
        // Retornar éxito de todos modos para que no se bloquee la UI
        return of({ success: true, message: 'Sesión cerrada localmente' });
      }),
      tap(() => {
        this.isLoggingOut = false;
      })
    );
  }

  /**
   * Cerrar sesión solo localmente (sin llamar al backend)
   * Usar solo en casos de emergencia o cuando el backend no responde
   */
  logoutLocal(): void {
    //console.log('🧹 Limpiando localStorage...');
    //console.log('Token antes:', localStorage.getItem('token') ? 'Existe' : 'No existe');
    
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    
    //console.log('Token después:', localStorage.getItem('token') ? 'Existe' : 'No existe');
    
    this.currentUserSubject.next(null);
    this.isLoggingOut = false;
    
    //console.log('✅ Sesión cerrada localmente');
    //console.log('Usuario actual:', this.currentUserValue);
    
    // Emitir evento para detener monitoreo de sesión
    window.dispatchEvent(new CustomEvent('session-ended'));
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Opcional: Verificar si el token ha expirado
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // Convertir a milisegundos
      
      if (Date.now() >= expiration) {
        console.warn('⏰ Token expirado');
        this.logoutLocal();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return false;
    }
  }

  /**
   * Obtener token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Verificar si un token específico es el token actual
   */
  isCurrentToken(token: string): boolean {
    const currentToken = this.getToken();
    return currentToken === token;
  }
}
