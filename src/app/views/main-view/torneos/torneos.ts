import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TorneoService } from '../../../services/torneo';
import { Torneo } from '../../../models/torneo';
import { ModalConfirmacionComponent } from '../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';
import { HoraAmPmPipe } from '../../../pipes/hora-ampm.pipe';

@Component({
  selector: 'app-torneos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalConfirmacionComponent, ToastNoti, HoraAmPmPipe],
  templateUrl: './torneos.html',
  styleUrls: ['./torneos.css']
})
export class TorneosComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneos: Torneo[] = [];
  torneosFiltrados: Torneo[] = [];
  loading = true;
  searchTerm = '';
  filtroActivo: 'todos' | 'activos' | 'finalizados' = 'todos';

  mostrarModalEliminar = false;
  mostrarModalEditar = false;
  torneoAEliminar: Torneo | null = null;
  torneoAEditar: Torneo | null = null;

  constructor(
    private torneoService: TorneoService,
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
          torneoCategorias: this.parsearJSON(t.torneoCategorias),
          activo: this.verificarEstadoTorneo(t)
        }));
        this.filtrarTorneos();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar torneos:', error);
        this.loading = false;
        this.toast.error('Error','Error al cargar los torneos');
        //this.mostrarAlerta('Error al cargar los torneos', 'error');
      }
    });
  }

  private verificarEstadoTorneo(torneo: Torneo): boolean {
    // Si la fecha del torneo ya pasó, debe estar finalizado
    const fechaTorneo = new Date(torneo.fecha);
    const hoy = new Date();

    // Resetear las horas para comparar solo fechas
    fechaTorneo.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    // Si la fecha del torneo es anterior a hoy, está finalizado
    if (fechaTorneo < hoy) {
      return false; // Finalizado
    }

    return torneo.activo ?? true;
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
    }

    if (this.searchTerm.trim()) {
      const termino = this.searchTerm.toLowerCase().trim();
      resultado = resultado.filter(t =>
        (t.nombre && t.nombre.toLowerCase().includes(termino)) ||
        t.lugar.toLowerCase().includes(termino)
      );
    }

    this.torneosFiltrados = resultado;
  }

  cambiarFiltro(filtro: 'todos' | 'activos' | 'finalizados'): void {
    this.filtroActivo = filtro;
    this.filtrarTorneos();
  }

  verDetalle(torneoId?: number): void {
    if (torneoId) {
      this.router.navigate(['/main-view/detalle-torneo', torneoId]);
    }
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
    if (this.torneoAEditar?.idTorneo) {
      this.mostrarModalEditar = false;
      this.router.navigate(['/main-view/editar-torneo', this.torneoAEditar.idTorneo]);
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
          //this.mostrarAlerta('Torneo eliminado exitosamente', 'success');
          this.toast.success('Torneo eliminado exitosamente', 'Se elimino el torneo con éxito');
          this.cargarTorneos();
          this.cancelarEliminacion();
        },
        error: (error) => {
          console.error('Error al eliminar torneo:', error);
          this.toast.error('Error','Error al eliminar el torneo');
          //this.mostrarAlerta('Error al eliminar el torneo', 'error');
          this.cancelarEliminacion();
        }
      });
    }
  }


  getDia(fecha: Date | string): number {
    // Crear fecha en zona horaria local para evitar desfases
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    return parseInt(day, 10);
  }

  getMes(fecha: Date | string): string {
    // Crear fecha en zona horaria local para evitar desfases
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase();
  }

  getAnio(fecha: Date | string): number {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year] = fechaStr.split('T')[0].split('-');
    return parseInt(year, 10);
  }

  formatearFechaCorta(fecha: Date | string): string {
    if (!fecha) return '';

    try {
      const date = new Date(fecha);

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return '';
    }
  }

  // Métodos auxiliares para obtener datos de torneoCategorias
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
    if (this.searchTerm.trim()) {
      return 'No se encontraron torneos';
    }
    if (this.filtroActivo === 'activos') {
      return 'No hay torneos activos';
    }
    if (this.filtroActivo === 'finalizados') {
      return 'No hay torneos finalizados';
    }
    return 'No hay torneos registrados';
  }

  getEmptyDescription(): string {
    if (this.searchTerm.trim()) {
      return 'Intenta con otros términos de búsqueda';
    }
    if (this.filtroActivo === 'activos') {
      return 'Crea un nuevo torneo para comenzar';
    }
    if (this.filtroActivo === 'finalizados') {
      return 'Los torneos finalizados aparecerán aquí';
    }
    return 'Comienza creando tu primer torneo';
  }
}
