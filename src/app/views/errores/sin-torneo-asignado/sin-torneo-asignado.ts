import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { SessionMonitorService } from '../../../services/session-monitor';
import { TorneoService } from '../../../services/torneo';
import { ErrorPageComponent } from '../../../componentes/templates/error-page/error-page';

@Component({
  selector: 'app-sin-torneo-asignado',
  standalone: true,
  imports: [ErrorPageComponent],
  templateUrl: './sin-torneo-asignado.html'
})
export class SinTorneoAsignadoComponent implements OnInit, OnDestroy {
  // Mientras el usuario está parado en esta pantalla esperando que le
  // asignen un torneo, chequear mucho más seguido que el ciclo genérico de
  // SessionMonitorService (30s) — es exactamente el momento en que más
  // importa enterarse rápido.
  private readonly CHECK_INTERVAL_MS = 5000;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    private authService: AuthService,
    private sessionMonitor: SessionMonitorService,
    private torneoService: TorneoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Chequeo inmediato: si se llega a esta ruta directamente (recarga,
    // link, "Actualizar Ahora" del modal) y ya hay un torneo asignado, no
    // hay que esperar el primer intervalo para salir de aquí.
    this.verificarTorneoAsignado();

    this.intervalId = setInterval(() => {
      this.sessionMonitor.verificarSesionInmediata();
      this.verificarTorneoAsignado();
    }, this.CHECK_INTERVAL_MS);
  }

  // Sin filtro de activo — ver session-monitor.ts / torneo-actual.ts: lo que
  // importa es la asignación, no si el torneo está marcado activo.
  private verificarTorneoAsignado(): void {
    this.torneoService.getAll().subscribe({
      next: (torneos) => {
        if (torneos && torneos.length > 0) {
          this.router.navigate(['/main-view/torneo-actual']);
        }
      },
      error: () => {
        // Si falla este chequeo puntual, el próximo intervalo lo reintenta.
      }
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
