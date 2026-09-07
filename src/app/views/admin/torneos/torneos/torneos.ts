import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TorneoService } from '../../../../services/torneo';
import { AuthService } from '../../../../services/auth';
import { Torneo, EstadoTorneo } from '../../../../models/torneo';
import { ModalConfirmacionComponent } from '../../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { ConfirmarPasswordComponent } from '../../../../componentes/modales/confirmar-password/confirmar-password';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { HoraAmPmPipe } from '../../../../pipes/hora-ampm.pipe';
import { AdminListPageComponent } from '../../../../componentes/templates/admin-list-page/admin-list-page';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconButtonComponent } from '../../../../componentes/atoms/icon-button/icon-button';
import { BadgeComponent, BadgeStatus } from '../../../../componentes/atoms/badge/badge';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { FilterChipOption } from '../../../../componentes/molecules/filter-chips/filter-chips';
import { verificarActivoPorFecha } from '../../../../utils/entidad-estado.util';

const ESTADO_BADGE: Record<EstadoTorneo, { status: BadgeStatus; text: string; icon: string }> = {
  borrador:   { status: 'pending',     text: 'Borrador',   icon: 'pencil-simple-line' },
  publicado:  { status: 'scheduled',   text: 'Publicado',  icon: 'check-circle' },
  en_curso:   { status: 'in-progress', text: 'En Curso',   icon: 'play-circle' },
  finalizado: { status: 'finished',    text: 'Finalizado', icon: 'flag-checkered' },
  cancelado:  { status: 'cancelled',   text: 'Cancelado',  icon: 'x-circle' },
};

@Component({
  selector: 'app-torneos',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ModalConfirmacionComponent, ConfirmarPasswordComponent, ToastNoti, HoraAmPmPipe,
    AdminListPageComponent, ButtonComponent, IconButtonComponent, BadgeComponent, IconComponent
  ],
  templateUrl: './torneos.html',
  styleUrls: ['./torneos.css']
})
export class TorneosComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneos: Torneo[] = [];
  torneosFiltrados: Torneo[] = [];
  loading = true;
  searchTerm = '';
  filtroActivo: 'todos' | 'activos' | 'finalizados' | 'borrador' = 'todos';

  readonly filterOptions: FilterChipOption[] = [
    { value: 'todos', label: 'Todos', icon: 'list' },
    { value: 'activos', label: 'Activos', icon: 'check-circle' },
    { value: 'finalizados', label: 'Finalizados', icon: 'x-circle' },
    { value: 'borrador', label: 'Borrador', icon: 'pencil-simple-line' }
  ];

  mostrarModalEliminar = false;
  mostrarModalEditar = false;
  torneoAEliminar: Torneo | null = null;
  torneoAEditar: Torneo | null = null;

  mostrarModalPublicar = false;
  torneoAPublicar: Torneo | null = null;
  publicando = false;
  errorPublicar = '';

  constructor(
    private torneoService: TorneoService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTorneos();
  }

  cargarTorneos(): void {
    this.loading = true;
    this.torneoService.getAll().subscribe({
      next: (torneos) => {
        this.torneos = torneos.map(t => ({
          ...t,
          // El backend devuelve la relación como 'torneo_categorias' (nombre del
          // modelo Prisma) — no 'torneoCategorias'. Sin este mapeo el conteo de
          // categorías siempre salía vacío.
          torneoCategorias: this.parsearJSON((t as any).torneo_categorias ?? t.torneoCategorias),
          activo: verificarActivoPorFecha(t.fecha, t.activo)
        }));
        this.filtrarTorneos();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar torneos:', error);
        this.loading = false;
        this.toast.error('No se pudieron cargar los torneos', error.error?.message);
      }
    });
  }

  parsearJSON(campo: any): any {
    if (!campo) return null;
    if (typeof campo === 'string') {
      try {
        return JSON.parse(campo);
      } catch (e) {
        console.error('Error al parsear JSON:', e);
        return null;
      }
    }
    return campo;
  }

  filtrarTorneos(): void {
    let resultado = this.torneos;

    if (this.filtroActivo === 'activos') {
      resultado = resultado.filter(t => t.activo);
    } else if (this.filtroActivo === 'finalizados') {
      resultado = resultado.filter(t => !t.activo);
    } else if (this.filtroActivo === 'borrador') {
      resultado = resultado.filter(t => t.estado === 'borrador');
    }

    if (this.searchTerm.trim()) {
      const termino = this.searchTerm.toLowerCase().trim();
      resultado = resultado.filter(t =>
        (t.nombre && t.nombre.toLowerCase().includes(termino)) ||
        t.lugar.toLowerCase().includes(termino)
      );
    }

    // Siempre ordenado por fecha del torneo, más reciente arriba —
    // sin agrupar ni relegar los borradores, sin importar el filtro activo.
    this.torneosFiltrados = [...resultado].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  onSearchChange(termino: string): void {
    this.searchTerm = termino;
    this.filtrarTorneos();
  }

  cambiarFiltro(filtro: string): void {
    this.filtroActivo = filtro as 'todos' | 'activos' | 'finalizados' | 'borrador';
    this.filtrarTorneos();
  }

  verDetalle(torneo: Torneo): void {
    if (!torneo.slug) return;
    if (torneo.estado === 'borrador') {
      this.router.navigate(['/main-view/editar-torneo', torneo.slug]);
    } else {
      this.router.navigate(['/main-view/detalle-torneo', torneo.slug]);
    }
  }

  getEstadoBadge(torneo: Torneo) {
    return ESTADO_BADGE[torneo.estado ?? 'borrador'];
  }

  /** Mismo criterio que la vista de Editar Torneo: lo mínimo para que un torneo sea publicable. */
  motivosFaltantesTorneo(torneo: Torneo): string[] {
    const motivos: string[] = [];
    if (!torneo.nombre) motivos.push('Falta el nombre del torneo');
    if (!torneo.lugar) motivos.push('Falta el lugar');
    if (!torneo.direccion) motivos.push('Falta la dirección');
    if (!torneo.fecha) motivos.push('Falta la fecha del torneo');
    if (!torneo.hora_inicio) motivos.push('Falta la hora de inicio');
    if (!torneo.hora_fin) motivos.push('Falta la hora de fin');
    if (!torneo.torneoCategorias || torneo.torneoCategorias.length === 0) motivos.push('Agrega al menos una categoría');
    return motivos;
  }

  torneoListoParaPublicar(torneo: Torneo): boolean {
    return this.motivosFaltantesTorneo(torneo).length === 0;
  }

  confirmarPublicacion(torneo: Torneo): void {
    if (!this.torneoListoParaPublicar(torneo)) {
      this.toast.error(
        'Faltan datos para publicar',
        this.motivosFaltantesTorneo(torneo).join(' · ')
      );
      return;
    }
    this.torneoAPublicar = torneo;
    this.errorPublicar = '';
    this.mostrarModalPublicar = true;
  }

  cancelarPublicacion(): void {
    this.mostrarModalPublicar = false;
    this.torneoAPublicar = null;
    this.errorPublicar = '';
  }

  publicarTorneo(password: string): void {
    if (!this.torneoAPublicar?.idTorneo) return;
    const idTorneo = this.torneoAPublicar.idTorneo;

    this.publicando = true;
    this.errorPublicar = '';

    this.authService.verificarPassword(password).subscribe({
      next: () => {
        this.torneoService.cambiarEstado(idTorneo, 'publicado').subscribe({
          next: () => {
            this.publicando = false;
            this.mostrarModalPublicar = false;
            this.torneoAPublicar = null;
            this.toast.success('Torneo publicado', 'El torneo ya es visible públicamente');
            this.cargarTorneos();
          },
          error: (error) => {
            this.publicando = false;
            this.mostrarModalPublicar = false;
            this.torneoAPublicar = null;
            this.toast.error('Error', error.error?.message || 'No se pudo publicar el torneo');
          }
        });
      },
      error: () => {
        this.publicando = false;
        this.errorPublicar = 'Contraseña incorrecta';
      }
    });
  }

  editarTorneo(torneoId?: number): void {
    if (torneoId) {
      const torneo = this.torneos.find(t => t.idTorneo === torneoId);
      if (torneo) {
        this.torneoAEditar = torneo;
        this.mostrarModalEditar = true;
      }
    }
  }

  confirmarEdicion(): void {
    if (this.torneoAEditar?.slug) {
      this.mostrarModalEditar = false;
      this.router.navigate(['/main-view/editar-torneo', this.torneoAEditar.slug]);
      this.torneoAEditar = null;
    }
  }

  cancelarEdicion(): void {
    this.mostrarModalEditar = false;
    this.torneoAEditar = null;
  }

  confirmarEliminacion(torneo: Torneo): void {
    this.torneoAEliminar = torneo;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminacion(): void {
    this.mostrarModalEliminar = false;
    this.torneoAEliminar = null;
  }

  eliminarTorneo(): void {
    if (this.torneoAEliminar?.idTorneo) {
      this.torneoService.delete(this.torneoAEliminar.idTorneo).subscribe({
        next: () => {
          this.toast.success('Torneo eliminado exitosamente', 'Se elimino el torneo con éxito');
          this.cargarTorneos();
          this.cancelarEliminacion();
        },
        error: (error) => {
          console.error('Error al eliminar torneo:', error);
          this.toast.error('Error', error.error?.message || 'Error al eliminar el torneo');
          this.cancelarEliminacion();
        }
      });
    }
  }

  getDia(fecha: Date | string): number {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [, , day] = fechaStr.split('T')[0].split('-');
    return parseInt(day, 10);
  }

  getMes(fecha: Date | string): string {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase();
  }

  formatearFechaCorta(fecha: Date | string): string {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return '';
    }
  }

  getSistemasCompetencia(torneo: Torneo): string {
    if (!torneo.torneoCategorias || torneo.torneoCategorias.length === 0) return '';
    const sistemas = torneo.torneoCategorias
      .map((tc: any) => tc.sistemaCompetencia)
      .filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i);
    return sistemas.length > 0 ? sistemas.join(', ') : '';
  }

  getRitmosJuego(torneo: Torneo): string {
    if (!torneo.torneoCategorias || torneo.torneoCategorias.length === 0) return '';
    const ritmos = torneo.torneoCategorias
      .map((tc: any) => tc.ritmoJuego)
      .filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i);
    return ritmos.length > 0 ? ritmos.join(', ') : '';
  }

  tieneSistemasCompetencia(torneo: Torneo): boolean {
    return !!this.getSistemasCompetencia(torneo);
  }

  tieneRitmosJuego(torneo: Torneo): boolean {
    return !!this.getRitmosJuego(torneo);
  }

  getEmptyMessage(): string {
    if (this.searchTerm.trim()) return 'No se encontraron torneos';
    if (this.filtroActivo === 'activos') return 'No hay torneos activos';
    if (this.filtroActivo === 'finalizados') return 'No hay torneos finalizados';
    if (this.filtroActivo === 'borrador') return 'No hay torneos en borrador';
    return 'No hay torneos registrados';
  }

  getEmptyDescription(): string {
    if (this.searchTerm.trim()) return 'Intenta con otros términos de búsqueda';
    if (this.filtroActivo === 'activos') return 'Crea un nuevo torneo para comenzar';
    if (this.filtroActivo === 'finalizados') return 'Los torneos finalizados aparecerán aquí';
    if (this.filtroActivo === 'borrador') return 'Los torneos sin publicar aparecerán aquí';
    return 'Comienza creando tu primer torneo';
  }
}
