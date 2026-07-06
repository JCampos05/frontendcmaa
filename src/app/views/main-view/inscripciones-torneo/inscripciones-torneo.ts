import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TorneoService } from '../../../services/torneo';
import { InscripcionService } from '../../../services/inscripcion';
import { Torneo } from '../../../models/torneo';
import { Inscripcion } from '../../../models/inscripcion';
import { ModalEdicionInscripcionComponent } from '../../../componentes/modales/edicion-inscripcion/edicion-inscripcion';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';
import { ModalConfirmacionComponent } from '../../../componentes/modales/modal-confirmacion/modal-confirmacion';


interface EstadisticasCategoria {
  idCategoria: number;
  nombreCategoria: string;
  totalInscritos: number;
  pagosConfirmados: number;
  pagosPendientes: number;
  totalRecaudado: number;
  promedioRating: number;
  ratingMasAlto: number;
  ratingMasBajo: number;
  inscripciones: Inscripcion[];
}

interface EstadisticasGenerales {
  totalInscritos: number;
  pagosConfirmados: number;
  pagosPendientes: number;
  totalRecaudado: number;
  porcentajePagos: number;
  promedioEdad: number;
  promedioRating: number;
}

@Component({
  selector: 'app-inscripciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalEdicionInscripcionComponent, ToastNoti, ModalConfirmacionComponent],
  templateUrl: './inscripciones-torneo.html',
  styleUrls: ['./inscripciones-torneo.css']
})
export class InscripcionesAdminComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneoSeleccionado: Torneo | null = null;
  categoriaSeleccionada: number | null = null;

  estadisticasGenerales: EstadisticasGenerales | null = null;
  estadisticasPorCategoria: EstadisticasCategoria[] = [];
  categorias: any[] = [];

  cargando = false;
  error: string | null = null;

  filtroNombre = '';
  filtroEstadoPago: string = 'todos';
  filtroEstadoInscripcion: string = 'todos';

  columnaOrden: string = 'fecha_inscripcion';
  direccionOrden: 'ASC' | 'DESC' = 'DESC';

  modalDetallesVisible = false;
  inscripcionSeleccionada: Inscripcion | null = null;

  modalEdicionVisible = false;

  // Modal de confirmación de pago
  mostrarModalConfirmacion = false;
  inscripcionParaConfirmar: Inscripcion | null = null;

  // Paginación
  paginaActual = 1;
  registrosPorPagina = 15;
  Math = Math;

  // Modal de confirmación de eliminación
  mostrarModalEliminacion = false;
  inscripcionParaEliminar: Inscripcion | null = null;

  constructor(
    private torneoService: TorneoService,
    private inscripcionService: InscripcionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTorneoActual();
  }

  cargarTorneoActual(): void {
    this.cargando = true;
    this.error = null;

    this.torneoService.getActivos().subscribe({
      next: (torneos) => {
        if (torneos && torneos.length > 0) {
          const torneosOrdenados = torneos.sort((a, b) => {
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          });

          const hoy = new Date();
          const tresDiasDespues = new Date();
          tresDiasDespues.setDate(hoy.getDate() + 3);

          const torneoEnRango = torneosOrdenados.find(t => {
            const fechaTorneo = new Date(t.fecha);
            return fechaTorneo >= hoy && fechaTorneo <= tresDiasDespues;
          });

          this.torneoSeleccionado = torneoEnRango || torneosOrdenados[0];

          if (this.torneoSeleccionado?.idTorneo) {
            this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
          }
        } else {
          this.error = 'No hay torneos activos';
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar el torneo actual';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  cargarInscripciones(idTorneo: number): void {
    this.inscripcionService.getByTorneo(idTorneo).subscribe({
      next: (inscripciones) => {
        this.procesarEstadisticas(inscripciones);
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar inscripciones';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  procesarEstadisticas(inscripciones: Inscripcion[]): void {

    const categorias = new Map<number, EstadisticasCategoria>();

    inscripciones.forEach(insc => {
      const montoPagadoNum = Number(insc.montoPagado) || 0;
      const costoCategoria = Number(insc.categoria?.costo) || 0;

      const pagoCompleto = montoPagadoNum >= costoCategoria && costoCategoria > 0;

      const idCat = insc.idCategoria || 0;

      if (!categorias.has(idCat)) {
        categorias.set(idCat, {
          idCategoria: idCat,
          nombreCategoria: insc.categoria?.nombre || 'Sin categoría',
          totalInscritos: 0,
          pagosConfirmados: 0,
          pagosPendientes: 0,
          totalRecaudado: 0,
          promedioRating: 0,
          ratingMasAlto: 0,
          ratingMasBajo: 9999,
          inscripciones: []
        });
      }

      const cat = categorias.get(idCat)!;
      cat.totalInscritos++;
      cat.inscripciones.push(insc);

      if (pagoCompleto) {
        cat.pagosConfirmados++;
      } else {
        cat.pagosPendientes++;
      }

      cat.totalRecaudado += montoPagadoNum;

      const rating = insc.jugador?.rating || 0;
      if (rating > 0) {
        cat.ratingMasAlto = Math.max(cat.ratingMasAlto, rating);
        cat.ratingMasBajo = Math.min(cat.ratingMasBajo, rating);
      }
    });

    categorias.forEach(cat => {
      const ratings = cat.inscripciones
        .map(i => i.jugador?.rating || 0)
        .filter(r => r > 0);

      cat.promedioRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      if (cat.ratingMasBajo === 9999) cat.ratingMasBajo = 0;
    });

    this.estadisticasPorCategoria = Array.from(categorias.values());
    this.cargarCategorias();

    const totalInscritos = inscripciones.length;

    const pagosConfirmados = inscripciones.filter(i => {
      const montoPagado = Number(i.montoPagado) || 0;
      const costo = Number(i.categoria?.costo) || 0;
      return montoPagado >= costo && costo > 0;
    }).length;

    const totalRecaudado = inscripciones.reduce((sum, i) => {
      return sum + (Number(i.montoPagado) || 0);
    }, 0);

    const edades = inscripciones
      .map(i => i.edad || 0)
      .filter(e => e > 0);

    const ratings = inscripciones
      .map(i => i.jugador?.rating || 0)
      .filter(r => r > 0);

    this.estadisticasGenerales = {
      totalInscritos,
      pagosConfirmados,
      pagosPendientes: totalInscritos - pagosConfirmados,
      totalRecaudado,
      porcentajePagos: totalInscritos > 0 ? (pagosConfirmados / totalInscritos) * 100 : 0,
      promedioEdad: edades.length > 0 ? edades.reduce((a, b) => a + b, 0) / edades.length : 0,
      promedioRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    };
  }

  cargarCategorias(): void {
    this.categorias = this.estadisticasPorCategoria.map(ec => ({
      idCategoria: ec.idCategoria,
      nombre: ec.nombreCategoria
    }));
  }

  seleccionarCategoria(idCategoria: number | null): void {
    this.categoriaSeleccionada = idCategoria;
    this.paginaActual = 1;
  }

  getInscripcionesFiltradas(): Inscripcion[] {
    let inscripciones: Inscripcion[] = [];

    if (this.categoriaSeleccionada === null) {
      inscripciones = this.estadisticasPorCategoria.flatMap(c => c.inscripciones);
    } else {
      const cat = this.estadisticasPorCategoria.find(c => c.idCategoria === this.categoriaSeleccionada);
      inscripciones = cat?.inscripciones || [];
    }

    if (this.filtroNombre) {
      const filtro = this.filtroNombre.toLowerCase();
      inscripciones = inscripciones.filter(i => {
        const nombreCompleto = `${i.jugador?.nombre || ''} ${i.jugador?.apellido1 || ''} ${i.jugador?.apellido2 || ''}`.toLowerCase();
        return nombreCompleto.includes(filtro);
      });
    }

    if (this.filtroEstadoPago !== 'todos') {
      inscripciones = inscripciones.filter(i => {
        const montoPagado = Number(i.montoPagado) || 0;
        const costoCategoria = Number(i.categoria?.costo) || 0;

        if (this.filtroEstadoPago === 'confirmado') {
          return montoPagado >= costoCategoria && costoCategoria > 0;
        }
        if (this.filtroEstadoPago === 'parcial') {
          return montoPagado > 0 && montoPagado < costoCategoria;
        }
        if (this.filtroEstadoPago === 'pendiente') {
          return montoPagado < costoCategoria;
        }

        return true;
      });
    }

    if (this.filtroEstadoInscripcion !== 'todos') {
      inscripciones = inscripciones.filter(i => i.estado === this.filtroEstadoInscripcion);
    }

    inscripciones.sort((a, b) => {
      let valorA: any, valorB: any;

      switch (this.columnaOrden) {
        case 'nombre':
          valorA = `${a.jugador?.nombre || ''} ${a.jugador?.apellido1 || ''}`;
          valorB = `${b.jugador?.nombre || ''} ${b.jugador?.apellido1 || ''}`;
          break;
        case 'rating':
          valorA = a.jugador?.rating || 0;
          valorB = b.jugador?.rating || 0;
          break;
        case 'edad':
          valorA = a.edad || 0;
          valorB = b.edad || 0;
          break;
        case 'monto':
          valorA = a.montoPagado || 0;
          valorB = b.montoPagado || 0;
          break;
        case 'fecha_inscripcion':
        default:
          valorA = new Date(a.fechaInscripcion || 0).getTime();
          valorB = new Date(b.fechaInscripcion || 0).getTime();
      }

      if (this.direccionOrden === 'ASC') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });

    return inscripciones;
  }

  ordenarPor(columna: string): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'ASC';
    }
  }

  confirmarPago(inscripcion: Inscripcion): void {
    if (!inscripcion.idInscripcion) return;

    const monto = inscripcion.categoria?.costo || 0;

    if (monto <= 0) {
      this.toast.error('Error', 'La categoria no tiene un costo definido');
      return;
    }

    // Guardar la inscripción y mostrar el modal
    this.inscripcionParaConfirmar = inscripcion;
    this.mostrarModalConfirmacion = true;
  }

  onConfirmarPago(): void {
    if (!this.inscripcionParaConfirmar?.idInscripcion) return;

    const monto = this.inscripcionParaConfirmar.categoria?.costo || 0;

    const datosActualizacion = {
      pago_confirmado: true,
      monto_pagado: Number(monto),
      estado: 'confirmado'
    };

    this.inscripcionService.update(this.inscripcionParaConfirmar.idInscripcion, datosActualizacion).subscribe({
      next: (response) => {
        this.toast.success('Jugador confirmado', 'Pago e inscripción confirmados exitosamente');
        this.mostrarModalConfirmacion = false;
        this.inscripcionParaConfirmar = null;
        this.actualizarEstadisticas();
      },
      error: (err) => {
        console.error('Error al confirmar el pago:', err);
        const mensaje = err?.error?.message || err?.error?.mensaje || 'Error al confirmar el pago';
        this.toast.error('Error', mensaje);
        this.mostrarModalConfirmacion = false;
        this.inscripcionParaConfirmar = null;
      }
    });
  }

  onCancelarConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.inscripcionParaConfirmar = null;
  }

  getMensajeConfirmacion(): string {
    if (!this.inscripcionParaConfirmar) return '';

    const nombreCompleto = `${this.inscripcionParaConfirmar.jugador?.nombre} ${this.inscripcionParaConfirmar.jugador?.apellido1}`;
    const monto = this.inscripcionParaConfirmar.categoria?.costo || 0;

    return `Se confirmará el pago de <strong>$${monto.toFixed(2)}</strong> para el jugador <strong>${nombreCompleto}</strong>`;
  }

  getMensajeSecundarioConfirmacion(): string {
    const montoPagado = Number(this.inscripcionParaConfirmar?.montoPagado) || 0;
    const costoCategoria = Number(this.inscripcionParaConfirmar?.categoria?.costo) || 0;

    if (montoPagado > 0 && montoPagado < costoCategoria) {
      return `El jugador ya tiene un pago parcial de $${montoPagado.toFixed(2)}. Esta acción completará el pago total.`;
    }

    return 'Esta acción actualizará el estado de la inscripción a confirmado.';
  }

  confirmarPagoModal(): void {
    if (this.inscripcionSeleccionada && !this.inscripcionSeleccionada.pagoConfirmado) {
      this.confirmarPago(this.inscripcionSeleccionada);
      this.cerrarModal();
    }
  }

  getMontoPagado(inscripcion: Inscripcion): number {
    const montoPagado = Number(inscripcion.montoPagado) || 0;
    return montoPagado;
  }

  puedePagarInscripcion(inscripcion: Inscripcion): boolean {
    const estadoPago = this.getEstadoPago(inscripcion);
    const costoCategoria = inscripcion.categoria?.costo || 0;
    const puedePagar = estadoPago !== 'confirmado' && costoCategoria > 0;
    return puedePagar;
  }

  actualizarEstadisticas(): void {
    if (this.torneoSeleccionado?.idTorneo) {
      this.cargarInscripciones(this.torneoSeleccionado.idTorneo);
    }
  }

  getEstadoPago(inscripcion: Inscripcion): 'confirmado' | 'parcial' | 'pendiente' {
    const montoPagado = Number(inscripcion.montoPagado) || 0;
    const costoCategoria = inscripcion.categoria?.costo || 0;
    const pagoConfirmado = Boolean(inscripcion.pagoConfirmado);

    if (pagoConfirmado && montoPagado >= costoCategoria) {
      return 'confirmado';
    }

    if (montoPagado > 0 && montoPagado < costoCategoria) {
      return 'parcial';
    }

    return 'pendiente';
  }

  getEstadoPagoClase(inscripcion: Inscripcion): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'status-confirmed';
      case 'parcial':
        return 'status-partial';
      case 'pendiente':
      default:
        return 'status-pending';
    }
  }

  getEstadoPagoTexto(inscripcion: Inscripcion): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'Confirmado';
      case 'parcial':
        return 'Pago Parcial';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }

  getEstadoPagoIcono(inscripcion: Inscripcion): string {
    const estadoPago = this.getEstadoPago(inscripcion);

    switch (estadoPago) {
      case 'confirmado':
        return 'fa-circle-check';
      case 'parcial':
        return 'fa-circle-half-stroke';
      case 'pendiente':
      default:
        return 'fa-clock';
    }
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatearFechaCompleta(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatearTelefono(telefono: string | undefined): string {
    if (!telefono) return '-';

    const telefonoLimpio = telefono.replace(/\D/g, '');

    if (telefonoLimpio.length === 10) {
      return telefonoLimpio.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }

    return telefono;
  }

  getEstadoClase(estado: string | undefined): string {
    switch (estado) {
      case 'confirmado': return 'status-confirmed';
      case 'pendiente': return 'status-pending';
      case 'cancelado': return 'status-cancelled';
      default: return '';
    }
  }

  getPorcentajePagosPorCategoria(cat: EstadisticasCategoria): number {
    return cat.totalInscritos > 0
      ? (cat.pagosConfirmados / cat.totalInscritos) * 100
      : 0;
  }

  exportarDatos(): void {
    const inscripciones = this.getInscripcionesFiltradas();
    const csv = this.generarCSV(inscripciones);
    this.descargarCSV(csv, `inscripciones_${this.torneoSeleccionado?.nombre || 'torneo'}.csv`);
  }

  private generarCSV(inscripciones: Inscripcion[]): string {
    const headers = ['Nombre', 'Apellido1', 'Apellido2', 'Teléfono', 'Edad', 'Rating', 'Categoría', 'Estado Pago', 'Monto', 'Estado Inscripción', 'Fecha'];

    const rows = inscripciones.map(i => [
      i.jugador?.nombre || '',
      i.jugador?.apellido1 || '',
      i.jugador?.apellido2 || '',
      i.jugador?.telefono || '',
      i.edad || '',
      i.jugador?.rating || '',
      i.categoria?.nombre || '',
      i.pagoConfirmado ? 'Confirmado' : 'Pendiente',
      i.montoPagado || 0,
      i.estado || '',
      this.formatearFecha(i.fechaInscripcion)
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private descargarCSV(contenido: string, nombreArchivo: string): void {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  verDetalles(inscripcion: Inscripcion): void {
    this.inscripcionSeleccionada = inscripcion;
    this.modalDetallesVisible = true;
  }

  cerrarModal(): void {
    this.modalDetallesVisible = false;
    this.inscripcionSeleccionada = null;
  }

  editarInscripcion(inscripcion: Inscripcion): void {
    this.inscripcionSeleccionada = inscripcion;
    this.modalEdicionVisible = true;
  }

  editarInscripcionModal(): void {
    if (this.inscripcionSeleccionada) {
      this.cerrarModal();
      this.modalEdicionVisible = true;
    }
  }

  cerrarModalEdicion(): void {
    this.modalEdicionVisible = false;
    this.inscripcionSeleccionada = null;
  }

  onModalEdicionActualizado(): void {
    this.cerrarModalEdicion();
    this.actualizarEstadisticas();
  }

  eliminarInscripcion(inscripcion: Inscripcion): void {
    if (!inscripcion.idInscripcion) return;

    // Guardar la inscripción y mostrar el modal
    this.inscripcionParaEliminar = inscripcion;
    this.mostrarModalEliminacion = true;
  }

  eliminarInscripcionModal(): void {
    if (this.inscripcionSeleccionada) {
      this.cerrarModal();
      this.eliminarInscripcion(this.inscripcionSeleccionada);
    }
  }

  onConfirmarEliminacion(): void {
    if (!this.inscripcionParaEliminar?.idInscripcion) return;

    this.inscripcionService.delete(this.inscripcionParaEliminar.idInscripcion).subscribe({
      next: () => {
        this.toast.success('Inscripción eliminada', 'La inscripción se eliminó exitosamente');
        this.mostrarModalEliminacion = false;
        this.inscripcionParaEliminar = null;
        this.actualizarEstadisticas();
      },
      error: (err) => {
        console.error('Error al eliminar la inscripción:', err);
        const mensaje = err?.error?.message || err?.error?.mensaje || 'Error al eliminar la inscripción';
        this.toast.error('Error', mensaje);
        this.mostrarModalEliminacion = false;
        this.inscripcionParaEliminar = null;
      }
    });
  }

  onCancelarEliminacion(): void {
    this.mostrarModalEliminacion = false;
    this.inscripcionParaEliminar = null;
  }

  getMensajeEliminacion(): string {
    if (!this.inscripcionParaEliminar) return '';

    const nombreCompleto = `${this.inscripcionParaEliminar.jugador?.nombre} ${this.inscripcionParaEliminar.jugador?.apellido1}`;

    return `¿Estás seguro de eliminar la inscripción de <strong>${nombreCompleto}</strong>?`;
  }

  getMensajeSecundarioEliminacion(): string {
    return 'Esta acción no se puede deshacer. Toda la información relacionada con esta inscripción será eliminada permanentemente.';
  }

  getInscripcionesPaginadas(): Inscripcion[] {
    const inscripcionesFiltradas = this.getInscripcionesFiltradas();
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return inscripcionesFiltradas.slice(inicio, fin);
  }

  getTotalPaginas(): number {
    const total = this.getInscripcionesFiltradas().length;
    return Math.ceil(total / this.registrosPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.getTotalPaginas()) {
      this.paginaActual = pagina;
    }
  }

  getPaginasArray(): number[] {
    const totalPaginas = this.getTotalPaginas();
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  getPaginasVisibles(): number[] {
    const totalPaginas = this.getTotalPaginas();
    const paginaActual = this.paginaActual;
    const paginas: number[] = [];

    if (totalPaginas <= 7) {
      return this.getPaginasArray();
    }

    paginas.push(1);

    if (paginaActual > 3) {
      paginas.push(-1);
    }

    const inicio = Math.max(2, paginaActual - 1);
    const fin = Math.min(totalPaginas - 1, paginaActual + 1);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    if (paginaActual < totalPaginas - 2) {
      paginas.push(-1);
    }

    paginas.push(totalPaginas);

    return paginas;
  }
}
