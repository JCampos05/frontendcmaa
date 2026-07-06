import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription, BehaviorSubject } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth';

/**
 * Servicio que monitorea el estado de la sesión
 * Verifica cada cierto tiempo si la sesión sigue siendo válida
 */
@Injectable({
  providedIn: 'root'
})
export class SessionMonitorService implements OnDestroy {
  private monitorSubscription: Subscription | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 segundos
  private isChecking = false; // Flag para evitar verificaciones múltiples
  
  // Observable para mostrar el modal
  private mostrarModalSubject = new BehaviorSubject<boolean>(false);
  public mostrarModal$ = this.mostrarModalSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicia el monitoreo de la sesión
   */
  startMonitoring(): void {
    // Solo monitorear si hay una sesión activa
    if (!this.authService.isAuthenticated()) {
      //console.log('🔍 SessionMonitor: No hay sesión activa, no se inicia monitoreo');
      return;
    }

    // Si ya está monitoreando, no iniciar de nuevo
    if (this.monitorSubscription) {
      //console.log('🔍 SessionMonitor: Ya está monitoreando');
      return;
    }

    //console.log('🔍 SessionMonitor: Iniciando monitoreo de sesión...');

    // IMPORTANTE: Verificar inmediatamente al iniciar
    this.verificarSesionInmediata();

    // Luego iniciar verificaciones periódicas
    this.monitorSubscription = interval(this.CHECK_INTERVAL)
      .pipe(
        switchMap(() => {
          // Verificar primero si hay token
          if (!this.authService.isAuthenticated()) {
            //console.log('🔍 SessionMonitor: No hay token, deteniendo monitoreo');
            this.stopMonitoring();
            return of(null);
          }

          // Si ya hay una verificación en curso, saltar esta
          if (this.isChecking) {
           // console.log('🔍 SessionMonitor: Verificación ya en curso, saltando...');
            return of(null);
          }

          // Hacer una petición ligera al servidor para verificar la sesión
          //console.log('🔍 SessionMonitor: Verificando sesión...');
          return this.authService.getProfile().pipe(
            catchError((error) => {
              if (error.status === 401) {
                console.error('🔍 SessionMonitor: Sesión inválida detectada');
                this.handleInvalidSession();
              }
              return of(null);
            })
          );
        })
      )
      .subscribe({
        next: (profile) => {
          if (profile) {
            //console.log('🔍 SessionMonitor: Sesión válida ✅');
          }
        },
        error: (error) => {
          //console.error('🔍 SessionMonitor: Error en monitoreo', error);
        }
      });
  }

  /**
   * Verifica la sesión inmediatamente (sin esperar el intervalo)
   * Se usa al iniciar la app o al volver de background
   */
  verificarSesionInmediata(): void {
    if (this.isChecking) {
      //console.log('🔍 SessionMonitor: Ya hay una verificación en curso');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      //console.log('🔍 SessionMonitor: No hay token para verificar');
      return;
    }

    this.isChecking = true;
    //console.log('🔍 SessionMonitor: Verificando sesión inmediatamente...');

    this.authService.getProfile().subscribe({
      next: (profile) => {
        //console.log('🔍 SessionMonitor: Sesión válida ', profile);
        this.isChecking = false;
      },
      error: (error) => {
        this.isChecking = false;
        
        if (error.status === 401) {
          //console.error('🔍 SessionMonitor: Sesión inválida o cerrada remotamente');
          this.handleInvalidSession();
        } else {
          //console.error('🔍 SessionMonitor: Error al verificar sesión', error);
        }
      }
    });
  }

  /**
   * Detiene el monitoreo de la sesión
   */
  stopMonitoring(): void {
    if (this.monitorSubscription) {
      //console.log('🔍 SessionMonitor: Deteniendo monitoreo');
      this.monitorSubscription.unsubscribe();
      this.monitorSubscription = null;
    }
    this.isChecking = false;
  }

  /**
   * Maneja una sesión inválida
   */
  private handleInvalidSession(): void {
    //console.warn('⚠️ SessionMonitor: Sesión cerrada remotamente o expirada');
    
    // Limpiar sesión local
    this.authService.logoutLocal();
    
    // Detener monitoreo
    this.stopMonitoring();
    
    // Mostrar modal en lugar de alert
    this.mostrarModalSubject.next(true);
  }

  /**
   * Método público para cuando el usuario hace clic en "Continuar" en el modal
   */
  public cerrarModalYRedirigir(): void {
    this.mostrarModalSubject.next(false);
    
    // Redirigir a login
    this.router.navigate(['/login'], {
      queryParams: { reason: 'session_closed' }
    });
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}