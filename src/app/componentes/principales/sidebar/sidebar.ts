import { Component, Input, OnInit, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isCollapsed = false;
  @Output() sidebarClosed = new EventEmitter<void>();

  isMobileOpen = false;

  rutaActual = '';
  submenuTorneosExpandido = false;
  submenuTorneoActualExpandido = false;
  submenuInscripcionesExpandido = false;
  submenuLigasExpandido = false;
  private routerSubscription?: Subscription;

  ngOnChanges(): void {
    if (this.esMobile) {
      this.isMobileOpen = !this.isCollapsed;
    }
  }

  // Detectar si es móvil
  get esMobile(): boolean {
    return window.innerWidth <= 768;
  }

  constructor(private router: Router, private authService: AuthService) { }

  get esAdminGral(): boolean {
    return this.authService.currentUserValue?.rol === 'adminGral';
  }

  ngOnInit(): void {
    this.rutaActual = this.router.url;
    this.actualizarSubmenusSegunRuta();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.rutaActual = event.url;
        this.actualizarSubmenusSegunRuta();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private actualizarSubmenusSegunRuta(): void {
    // Expandir submenu Torneos
    if (this.rutaActual.includes('/detalle-torneo') ||
      this.rutaActual.includes('/editar-torneo')) {
      this.submenuTorneosExpandido = true;
    }

    // Expandir submenu Torneo Actual
    if (this.rutaActual.includes('/torneo-actual') ||
      this.rutaActual.includes('/inscripciones-torneo') ||
      this.rutaActual.includes('/listas') ||
      this.rutaActual.includes('/mesas-torneo') ||
      this.rutaActual.includes('/resultados-torneo')) {
      this.submenuTorneoActualExpandido = true;
    }

    // Expandir submenu Inscripciones
    if (this.rutaActual.includes('/jugadores-torneo') ||
      this.rutaActual.includes('/estadisticas-pago')) {
      this.submenuInscripcionesExpandido = true;
    }
    // Expandir submenu Ligas
    if (this.rutaActual.includes('/detalle-liga') ||
      this.rutaActual.includes('/editar-liga')) {
      this.submenuLigasExpandido = true;
    }
  }

  // === NAVEGACIÓN PRINCIPAL ===
  cargarTorneoActual(): void {
    this.router.navigate(['/main-view/torneo-actual']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarInscripcionesTorneo(): void {
    this.router.navigate(['/main-view/inscripciones-torneo']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarInscripcionesGenerales(): void {
    this.router.navigate(['/main-view/inscripciones-generales']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarListas(): void {
    this.router.navigate(['/main-view/listas']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarMesas(): void {
    this.router.navigate(['/main-view/mesas-torneo']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarResultados(): void {
    this.router.navigate(['/main-view/resultados-torneo']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  // === INSCRIPCIONES ===
  cargarJugadoresPorTorneo(): void {
    this.router.navigate(['/main-view/jugadores-torneo']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarEstadisticasPago(): void {
    this.router.navigate(['/main-view/estadisticas-pago']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  // === GESTIÓN TORNEOS ===
  cargarTorneos(): void {
    this.router.navigate(['/main-view/torneos']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  nuevoTorneo(): void {
    this.router.navigate(['/main-view/nuevo-torneo']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarConfiguracionTorneos(): void {
    this.router.navigate(['/main-view/configuracion-torneos']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarSistemasPago(): void {
    this.router.navigate(['/main-view/sistemas-pago']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  verResultadosTorneos(): void {
    this.router.navigate(['/main-view/resultado-todos-torneos']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  verResultadosMesas(): void {
    this.router.navigate(['/main-view/visualizacion-mesas']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  verDetalleTorneo(): void {
    const match = this.rutaActual.match(/\/(detalle-torneo|editar-torneo)\/(\d+)/);
    if (match) {
      this.router.navigate(['/main-view/detalle-torneo', match[2]]);
    } else {
      this.router.navigate(['/main-view/torneos']);
    }
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  editarTorneoActual(): void {
    const match = this.rutaActual.match(/\/(detalle-torneo|editar-torneo)\/(\d+)/);
    if (match) {
      this.router.navigate(['/main-view/editar-torneo', match[2]]);
    } else {
      this.router.navigate(['/main-view/torneos']);
    }
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  // === GESTIÓN LIGA ===
  cargarLigas(): void {
    this.router.navigate(['/main-view/ligas']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  nuevaLiga(): void {
    this.router.navigate(['/main-view/nueva-liga']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  verResultadosLigas(): void {
    this.router.navigate(['/main-view/resultado-todas-ligas']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarInscripcionesLiga(): void {
    this.router.navigate(['/main-view/inscripciones-liga']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  verResultadosMesasLiga(): void {
    this.router.navigate(['/main-view/mesas-liga']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  verDetalleLiga(): void {
    const match = this.rutaActual.match(/\/(detalle-liga|editar-liga)\/(\d+)/);
    if (match) {
      this.router.navigate(['/main-view/detalle-liga', match[2]]);
    } else {
      this.router.navigate(['/main-view/ligas']);
    }
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  editarLigaActual(): void {
    const match = this.rutaActual.match(/\/(detalle-liga|editar-liga)\/(\d+)/);
    if (match) {
      this.router.navigate(['/main-view/editar-liga', match[2]]);
    } else {
      this.router.navigate(['/main-view/ligas']);
    }
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  toggleSubmenuLigas(event: Event): void {
    event.stopPropagation();
    this.submenuLigasExpandido = !this.submenuLigasExpandido;
  }

  // === GESTIÓN JUGADORES ===
  cargarGestionJugadores(): void {
    this.router.navigate(['/main-view/gestion-jugadores']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarInscripcionesAdmin(): void {
    this.router.navigate(['/main-view/inscripcion-admin']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  cargarHistorialJugador(): void {
    this.router.navigate(['/main-view/historial-jugador-torneo']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  // === SISTEMA ===
  cargarConfiguracion(): void {
    this.router.navigate(['/main-view/configuracion']);
    if (this.esMobile) this.cerrarSidebarMovil();
  }

  // === CERRAR SIDEBAR EN MÓVIL ===
  cerrarSidebarMovil(): void {
    if (this.esMobile) {
      this.isMobileOpen = false;
      this.sidebarClosed.emit();
    }
  }

  // === SUBMENUS ===
  toggleSubmenuTorneos(event: Event): void {
    event.stopPropagation();
    this.submenuTorneosExpandido = !this.submenuTorneosExpandido;
  }

  toggleSubmenuTorneoActual(event: Event): void {
    event.stopPropagation();
    this.submenuTorneoActualExpandido = !this.submenuTorneoActualExpandido;
  }

  toggleSubmenuInscripciones(event: Event): void {
    event.stopPropagation();
    this.submenuInscripcionesExpandido = !this.submenuInscripcionesExpandido;
  }

  // === DETECCIÓN DE RUTAS ACTIVAS ===
  esRutaActiva(ruta: string): boolean {
    // Torneo Actual
    if (ruta === '/main-view/torneo-actual') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/inscripciones-torneo') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/listas') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/mesas-torneo') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/resultados-torneo') {
      return this.rutaActual === ruta;
    }

    // Inscripciones
    if (ruta === '/main-view/inscripciones-generales') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/jugadores-torneo') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/estadisticas-pago') {
      return this.rutaActual === ruta;
    }

    // Gestión Torneos
    if (ruta === '/main-view/torneos') {
      return this.rutaActual === ruta ||
        this.rutaActual.startsWith('/main-view/torneos/');
    }

    if (ruta === '/main-view/detalle-torneo') {
      return this.rutaActual.startsWith('/main-view/detalle-torneo/');
    }

    if (ruta === '/main-view/editar-torneo') {
      return this.rutaActual.startsWith('/main-view/editar-torneo/');
    }

    if (ruta === '/main-view/resultado-todos-torneos') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/visualizacion-mesas') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/nuevo-torneo') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/configuracion-torneos') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/sistemas-pago') {
      return this.rutaActual === ruta;
    }

    // Gestión Ligas
    if (ruta === '/main-view/ligas') {
      return this.rutaActual === ruta ||
        this.rutaActual.startsWith('/main-view/ligas/');
    }

    if (ruta === '/main-view/detalle-liga') {
      return this.rutaActual.startsWith('/main-view/detalle-liga/');
    }

    if (ruta === '/main-view/editar-liga') {
      return this.rutaActual.startsWith('/main-view/editar-liga/');
    }

    if (ruta === '/main-view/resultado-todas-ligas') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/visualizacion-mesas-liga') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/nueva-liga') {
      return this.rutaActual === ruta;
    }

    // Gestión Jugadores
    if (ruta === '/main-view/gestion-jugadores') {
      return this.rutaActual === ruta;
    }

    if (ruta === '/main-view/historial-jugador-torneo') {
      return this.rutaActual === ruta;
    }

    // Sistema
    if (ruta === '/main-view/configuracion') {
      return this.rutaActual === ruta;
    }

    return this.rutaActual === ruta || this.rutaActual.startsWith(ruta + '/');
  }
}