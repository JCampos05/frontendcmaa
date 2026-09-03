import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';
import { SessionMonitorService } from './session-monitor';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const sessionMonitor = inject(SessionMonitorService);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    //console.log('🔒 Token agregado a la petición');
  } else {
    //console.warn('⚠️ No hay token disponible');
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo tratar el 401 como "sesión inválida" si la petición SÍ llevaba
      // token (una petición autenticada que el backend rechazó). Un 401 sin
      // token es, por ejemplo, credenciales incorrectas en /auth/login —
      // eso lo maneja el propio formulario de login, no este modal.
      if (error.status === 401 && token) {
        // Sesión inválida por el motivo que sea (expiración, cierre remoto,
        // cambio de password, cambio de rol) — mostrar el modal explicativo
        // en vez de redirigir en silencio. Mismo punto único que usa el
        // polling de SessionMonitorService.
        sessionMonitor.mostrarModalPorSesionInvalida('remota');
      }
      return throwError(() => error);
    })
  );
};
