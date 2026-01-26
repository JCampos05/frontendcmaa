import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InfoLigaService } from '../../../services/infoLiga/info-liga';
import { InfoLiga } from '../../../models/infoLiga';
import { ModalConfirmacionComponent } from '../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

@Component({
  selector: 'app-ligas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalConfirmacionComponent, ToastNoti],
  templateUrl: './ligas.html',
  styleUrls: ['./ligas.css']
})
export class LigasComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  ligas: InfoLiga[] = [];
  ligasFiltradas: InfoLiga[] = [];
  loading = true;
  searchTerm = '';
  filtroActivo: 'todos' | 'activos' | 'finalizados' = 'todos';

  mostrarModalEliminar = false;
  mostrarModalEditar = false;
  ligaAEliminar: InfoLiga | null = null;
  ligaAEditar: InfoLiga | null = null;

  constructor(
    private infoLigaService: InfoLigaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarLigas();
  }

  cargarLigas(): void {
    this.loading = true;
    this.infoLigaService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas.map(l => ({
          ...l,
          activo: this.verificarEstadoLiga(l)
        }));
        this.filtrarLigas();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar ligas:', error);
        this.loading = false;
        this.toast.error('Error', 'Error al cargar las ligas');
      }
    });
  }

  private verificarEstadoLiga(liga: InfoLiga): number {
    if (liga.fecha_fin) {
      const fechaFin = new Date(liga.fecha_fin);
      const hoy = new Date();
      
      fechaFin.setHours(0, 0, 0, 0);
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaFin < hoy) {
        return 0;
      }
    }
    
    return liga.activo ?? 1;
  }

  filtrarLigas(): void {
    let resultado = this.ligas;

    if (this.filtroActivo === 'activos') {
      resultado = resultado.filter(l => l.activo);
    } else if (this.filtroActivo === 'finalizados') {
      resultado = resultado.filter(l => !l.activo);
    }

    if (this.searchTerm.trim()) {
      const termino = this.searchTerm.toLowerCase().trim();
      resultado = resultado.filter(l =>
        (l.nombre && l.nombre.toLowerCase().includes(termino)) ||
        (l.lugar && l.lugar.toLowerCase().includes(termino))
      );
    }

    this.ligasFiltradas = resultado;
  }

  cambiarFiltro(filtro: 'todos' | 'activos' | 'finalizados'): void {
    this.filtroActivo = filtro;
    this.filtrarLigas();
  }

  verDetalle(ligaId?: number): void {
    if (ligaId) {
      this.router.navigate(['/main-view/detalle-liga', ligaId]);
    }
  }

  editarLiga(ligaId?: number): void {
    if (ligaId) {
      const liga = this.ligas.find(l => l.idLiga === ligaId);
      if (liga) {
        this.ligaAEditar = liga;
        this.mostrarModalEditar = true;
      }
    }
  }

  confirmarEdicion(): void {
    if (this.ligaAEditar?.idLiga) {
      this.mostrarModalEditar = false;
      this.router.navigate(['/main-view/editar-liga', this.ligaAEditar.idLiga]);
      this.ligaAEditar = null;
    }
  }

  cancelarEdicion(): void {
    this.mostrarModalEditar = false;
    this.ligaAEditar = null;
  }

  confirmarEliminacion(liga: InfoLiga): void {
    this.ligaAEliminar = liga;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminacion(): void {
    this.mostrarModalEliminar = false;
    this.ligaAEliminar = null;
  }

  eliminarLiga(): void {
    if (this.ligaAEliminar?.idLiga) {
      this.infoLigaService.delete(this.ligaAEliminar.idLiga).subscribe({
        next: () => {
          this.toast.success('Liga eliminada exitosamente', 'Se eliminó la liga con éxito');
          this.cargarLigas();
          this.cancelarEliminacion();
        },
        error: (error) => {
          console.error('Error al eliminar liga:', error);
          this.toast.error('Error', 'Error al eliminar la liga');
          this.cancelarEliminacion();
        }
      });
    }
  }

  getDia(fecha: Date | string): number {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
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

  formatearFechaRango(fechaInicio: Date | string, fechaFin?: Date | string): string {
    if (!fechaInicio) return '';
    
    const inicio = this.formatearFechaSolo(fechaInicio);
    
    if (!fechaFin) {
      return `Desde ${inicio}`;
    }
    
    const fin = this.formatearFechaSolo(fechaFin);
    return `${inicio} - ${fin}`;
  }

  private formatearFechaSolo(fecha: Date | string): string {
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  getTipoSistema(tipo?: string): string {
    const sistemas: { [key: string]: string } = {
      'round_robin': 'Round Robin',
      'suizo': 'Sistema Suizo',
      'grupos': 'Por Grupos'
    };
    
    return tipo ? sistemas[tipo] || tipo : 'Por Grupos';
  }

  getEmptyMessage(): string {
    if (this.searchTerm.trim()) {
      return 'No se encontraron ligas';
    }
    if (this.filtroActivo === 'activos') {
      return 'No hay ligas activas';
    }
    if (this.filtroActivo === 'finalizados') {
      return 'No hay ligas finalizadas';
    }
    return 'No hay ligas registradas';
  }

  getEmptyDescription(): string {
    if (this.searchTerm.trim()) {
      return 'Intenta con otros términos de búsqueda';
    }
    if (this.filtroActivo === 'activos') {
      return 'Crea una nueva liga para comenzar';
    }
    if (this.filtroActivo === 'finalizados') {
      return 'Las ligas finalizadas aparecerán aquí';
    }
    return 'Comienza creando tu primera liga';
  }
}