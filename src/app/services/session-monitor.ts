import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription, BehaviorSubject } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth';
import { TorneoService } from './torneo';
import { Usuario } from '../models/usuario';

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

  // Motivo del modal: sesión cerrada remotamente (default), cambio de rol o torneo recién asignado
  private motivoModalSubject = new BehaviorSubject<'remota' | 'rol' | 'torneo'>('remota');
  public motivoModal$ = this.motivoModalSubject.asObservable();

  // Snapshot de los idTorneo asignados en el último check — null hasta el
  // primer chequeo exitoso (no se notifica en ese primer chequeo, solo
  // establece la línea base para comparar contra los siguientes).
  private torneosAsignadosConocidos: number[] | null = null;

  constructor(
    private authService: AuthService,
    private torneoService: TorneoService,
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
            this.verificarCambios(profile);
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
        this.verificarCambios(profile);
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
    // Limpiar la línea base de torneos asignados — si otro usuario inicia
    // sesión en la misma pestaña, debe establecer su propia línea base.
    this.torneosAsignadosConocidos = null;
  }

  /**
   * Orquesta las comparaciones de cada chequeo exitoso: primero rol (si
   * cambió, ya avisa y refresca el usuario local — el chequeo de torneos de
   * este mismo ciclo se salta, el próximo ciclo ya corre con el rol nuevo),
   * y si el rol sigue siendo adminTorneo, si cambió el conjunto de torneos
   * asignados.
   */
  private verificarCambios(profile: Usuario): void {
    if (this.verificarCambioDeRol(profile)) {
      return;
    }

    if (profile.rol === 'adminTorneo') {
      this.verificarCambioDeTorneosAsignados();
    }
  }

  /**
   * Compara el rol devuelto por el backend (fresco de BD) contra el rol
   * cacheado en localStorage al momento del login. Si difieren, el rol del
   * usuario fue editado por un admin mientras la sesión seguía activa.
   * Devuelve true si detectó el cambio (y ya disparó el modal).
   */
  private verificarCambioDeRol(profile: Usuario): boolean {
    const rolActual = this.authService.currentUserValue?.rol;
    if (rolActual && profile.rol && profile.rol !== rolActual) {
      this.handleRolCambiado();
      return true;
    }
    return false;
  }

  /**
   * Compara los torneos asignados actuales contra el último snapshot
   * conocido. El primer chequeo tras iniciar sesión solo establece la línea
   * base (no notifica); los siguientes, si el conjunto cambió (se agregó o
   * quitó algún torneo), avisan con el modal en vez de esperar a que el
   * usuario recargue por su cuenta.
   */
  private verificarCambioDeTorneosAsignados(): void {
    // Sin filtro de `activo`: lo que importa aquí es la ASIGNACIÓN
    // (admins_asignados, ya acotada server-side para adminTorneo), no si el
    // torneo está marcado activo/archivado. Filtrar por activo=true dejaba
    // sin detectar cualquier torneo asignado que no estuviera en ese estado
    // (p.ej. uno recién asignado que todavía no se activa), y esa misma
    // pantalla de "sin torneo asignado" (torneo-actual.ts) usa el mismo
    // criterio, así que había que corregir ambos lados igual.
    this.torneoService.getAll().subscribe({
      next: (torneos) => {
        const idsActuales = (torneos || [])
          .map(t => t.idTorneo)
          .filter((id): id is number => id !== undefined)
          .sort((a, b) => a - b);

        if (this.torneosAsignadosConocidos === null) {
          this.torneosAsignadosConocidos = idsActuales;
          return;
        }

        const cambiaron = idsActuales.join(',') !== this.torneosAsignadosConocidos.join(',');
        // Actualizar la línea base SIEMPRE (haya cambiado o no), para no
        // seguir comparando contra un snapshot viejo en el próximo ciclo.
        this.torneosAsignadosConocidos = idsActuales;

        if (cambiaron) {
          this.handleTorneoAsignado();
        }
      },
      error: () => {
        // Si falla esta verificación puntual no se interrumpe la sesión —
        // el próximo ciclo de polling lo vuelve a intentar.
      }
    });
  }

  /**
   * Maneja una sesión inválida (cerrada remotamente o expirada)
   */
  private handleInvalidSession(): void {
    this.mostrarModalPorSesionInvalida('remota');
  }

  /**
   * Maneja un cambio de rol detectado en sesión activa. No es un problema de
   * seguridad (la autorización real ya se revalida por request contra BD),
   * pero el rol determina qué rutas/guards/menú le corresponden al usuario,
   * así que en vez de solo refrescar en memoria, se cierra la sesión local
   * y se muestra el modal en modo informativo pidiendo reautenticar — al
   * volver a loguear, todo (guards, sidebar, torneos visibles) se reconstruye
   * consistente con el rol nuevo.
   */
  private handleRolCambiado(): void {
    this.authService.logoutLocal();
    this.stopMonitoring();
    this.motivoModalSubject.next('rol');
    this.mostrarModalSubject.next(true);
  }

  /**
   * Maneja la detección de un torneo recién asignado (o removido) en sesión
   * activa. A diferencia de handleInvalidSession/handleRolCambiado, esto NO
   * es un problema de seguridad — el token sigue siendo válido y no hay que
   * cerrar sesión, solo avisar y refrescar los datos en memoria. Se muestra
   * el mismo modal pero en modo informativo (ver ModalSesionCerradaComponent).
   */
  private handleTorneoAsignado(): void {
    this.motivoModalSubject.next('torneo');
    this.mostrarModalSubject.next(true);
  }

  /**
   * Punto único que limpia la sesión local, detiene el monitoreo y muestra
   * el modal con el motivo correspondiente. Público para que el interceptor
   * HTTP lo use también ante cualquier 401 real (sesión inválida: expiración,
   * cierre remoto, cambio de password, torneo removido — cambio de rol y
   * torneo asignado ya NO producen 401, se manejan de forma informativa sin
   * cerrar sesión, ver handleRolCambiado/handleTorneoAsignado), en vez de
   * redirigir en silencio sin explicar por qué.
   */
  public mostrarModalPorSesionInvalida(motivo: 'remota' | 'rol' | 'torneo' = 'remota'): void {
    //console.warn(' SessionMonitor: Sesión inválida —', motivo);

    // Limpiar sesión local
    this.authService.logoutLocal();

    // Detener monitoreo
    this.stopMonitoring();

    // Mostrar modal con el motivo correspondiente
    this.motivoModalSubject.next(motivo);
    this.mostrarModalSubject.next(true);
  }

  /**
   * Valor actual del motivo del modal (lectura síncrona, para decidir qué
   * acción tomar al hacer clic en el botón del modal).
   */
  public get motivoActual(): 'remota' | 'rol' | 'torneo' {
    return this.motivoModalSubject.value;
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

  /**
   * Cierra el modal sin cerrar sesión — usado en el caso 'torneo', donde la
   * sesión sigue siendo válida y solo hace falta refrescar los datos.
   */
  public cerrarModalSinCerrarSesion(): void {
    this.mostrarModalSubject.next(false);
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}