import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { TorneoService } from '../../services/torneo/torneo';
import { RondaService } from '../../services/ronda/ronda';
import { MesaService } from '../../services/mesa/mesa';
import { TorneoCategoriaService } from '../../services/torneo-categoria/torneo-categoria';
import { EstadisticaTorneoService } from '../../services/estadistica-torneo/estadistica-torneo';
import { JugadorService } from '../../services/jugador/jugador';
import { ToastNoti } from '../../componentes/modales/toast-noti/toast-noti';

import { Torneo } from '../../models/torneo';
import { TorneoCategoria } from '../../models/torneo-categoria';
import { Ronda } from '../../models/ronda';
import { Mesa } from '../../models/mesa';
import { EstadisticaTorneo } from '../../models/estadistica-torneo';

@Component({
  selector: 'app-jugador-resultado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToastNoti
  ],
  templateUrl: './jugador-resultado.html',
  styleUrls: ['./jugador-resultado.css']
})
export class JugadorResultadoComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  // Datos
  torneos: Torneo[] = [];
  torneoSeleccionado: Torneo | null = null;
  categorias: TorneoCategoria[] = [];
  categoriaSeleccionada: TorneoCategoria | null = null;
  rondasDisponibles: Ronda[] = [];
  rondaSeleccionada: number | null = 0;
  rondaActualData: Ronda | null = null;
  mesasRonda: Mesa[] = [];

  // Lista Inicial y Final
  listaInicial: any[] = [];
  listaFinal: EstadisticaTorneo[] = [];
  sistemasDesempateActual: string[] = [];
  rankingFinalCargado = false;

  // Búsqueda de jugador
  nombreJugadorBusqueda: string = '';
  jugadorEncontrado: boolean = false;
  mesaJugadorId: number | null = null;

  // Estados
  cargandoTorneos = false;
  cargandoCategorias = false;
  cargandoRondas = false;
  cargandoMesas = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private torneoService: TorneoService,
    private rondaService: RondaService,
    private mesaService: MesaService,
    private torneoCategoriaService: TorneoCategoriaService,
    private estadisticaService: EstadisticaTorneoService,
    private jugadorService: JugadorService
  ) { }

  ngOnInit(): void {
    this.cargarTorneos();

    this.route.queryParams.subscribe(params => {
      if (params['torneo']) {
        const idTorneo = parseInt(params['torneo']);
        if (!isNaN(idTorneo)) {
          setTimeout(() => {
            const torneo = this.torneos.find(t => t.idTorneo === idTorneo);
            if (torneo) {
              this.torneoSeleccionado = torneo;
              this.onTorneoChange();
            }
          }, 500);
        }
      }
    });
  }

  cargarTorneos(): void {
    this.cargandoTorneos = true;
    this.error = null;

    this.torneoService.getTodosPublico().subscribe({
      next: (torneos) => {
        this.torneos = torneos || [];
        this.cargandoTorneos = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los torneos';
        console.error('Error:', err);
        this.cargandoTorneos = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar los torneos');
      }
    });
  }

  onTorneoChange(): void {
    this.categoriaSeleccionada = null;
    this.categorias = [];
    this.rondasDisponibles = [];
    this.rondaSeleccionada = 0;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.listaInicial = [];
    this.listaFinal = [];
    this.sistemasDesempateActual = [];
    this.rankingFinalCargado = false;
    this.resetearBusqueda();

    if (this.torneoSeleccionado?.idTorneo) {
      this.cargarCategorias(this.torneoSeleccionado.idTorneo);
    }
  }

  cargarCategorias(idTorneo: number): void {
    this.cargandoCategorias = true;

    this.torneoCategoriaService.getByTorneo(idTorneo).subscribe({
      next: (categorias) => {
        this.categorias = categorias || [];
        this.cargandoCategorias = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.cargandoCategorias = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las categorías');
      }
    });
  }

  onCategoriaChange(): void {
    this.rondaSeleccionada = 0;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.rondasDisponibles = [];
    this.listaInicial = [];
    this.listaFinal = [];
    this.sistemasDesempateActual = [];
    this.rankingFinalCargado = false;
    this.resetearBusqueda();

    if (this.categoriaSeleccionada && this.torneoSeleccionado?.idTorneo) {
      const idCategoria = this.categoriaSeleccionada.idCategoria;

      if (idCategoria) {
        this.cargarRondas(this.torneoSeleccionado.idTorneo, idCategoria);
        this.cargarSistemasDesempate();
        this.cargarListaInicial();
      }
    }
  }

  cargarRondas(idTorneo: number, idCategoria: number): void {
    this.cargandoRondas = true;

    this.rondaService.getRondasByTorneoPublico(idTorneo).subscribe({
      next: (rondas) => {
        const idTorneoCat = this.categoriaSeleccionada?.idTorneoCat;

        if (!idTorneoCat) {
          console.error('No se encontró idTorneoCat');
          this.cargandoRondas = false;
          return;
        }

        this.rondasDisponibles = Array.isArray(rondas)
          ? rondas.filter((r: Ronda) => r.idTorneoCategoria === idTorneoCat)
            .sort((a, b) => a.numeroRonda - b.numeroRonda)
          : [];

        const todasFinalizadas = this.rondasDisponibles.length > 0 &&
          this.rondasDisponibles.every(r => r.estado === 'finalizada');

        if (todasFinalizadas) {
          this.verificarRankingFinal();
        }

        this.cargandoRondas = false;
      },
      error: (err) => {
        console.error('Error al cargar rondas:', err);
        this.rondasDisponibles = [];
        this.cargandoRondas = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las rondas');
      }
    });
  }

  onRondaChange(): void {
  console.log('TEST');

    this.resetearBusqueda();
    this.mesasRonda = [];
    this.rondaActualData = null;
    this.listaInicial = [];
    this.listaFinal = [];

  console.log('TEST');

    if (this.rondaSeleccionada === 0) {
      console.log('LISTA INICIAL');
      this.cargarListaInicial();
      return;
    }

    if (this.rondaSeleccionada === -1) {
      this.cargarListaFinal();
      return;
    }

    if (this.rondaSeleccionada) {
      const ronda = this.rondasDisponibles.find(
        r => r.numeroRonda === this.rondaSeleccionada
      );

      if (ronda) {
        this.rondaActualData = ronda;
        this.cargarMesasRonda(ronda.idRonda);
      }
    }
  }

  cargarMesasRonda(idRonda: number): void {
    this.cargandoMesas = true;

    this.mesaService.getMesasByRondaPublico(idRonda).subscribe({
      next: (mesas) => {
        this.mesasRonda = Array.isArray(mesas) ? mesas : [];
        this.cargandoMesas = false;
        this.cargandoRondas = false;

        if (this.nombreJugadorBusqueda.trim()) {
          this.buscarJugador();
        }
      },
      error: (err) => {
        console.error('Error al cargar mesas:', err);
        this.mesasRonda = [];
        this.cargandoMesas = false;
        this.cargandoRondas = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las mesas');
      }
    });
  }

  buscarJugador(): void {
    const nombreBusqueda = this.nombreJugadorBusqueda.trim().toLowerCase();

    if (!nombreBusqueda) {
      this.resetearBusqueda();
      return;
    }

    if (this.mesasRonda.length === 0) {
      this.jugadorEncontrado = false;
      this.mesaJugadorId = null;
      this.mostrarToast('warning', 'Sin mesas', 'No hay mesas disponibles para buscar');
      return;
    }

    const mesaEncontrada = this.mesasRonda.find(mesa => {
      const nombreBlanco = `${mesa.jugador_blanco?.nombre || ''} ${mesa.jugador_blanco?.apellido1 || ''}`.toLowerCase();
      const nombreNegro = `${mesa.jugador_negro?.nombre || ''} ${mesa.jugador_negro?.apellido1 || ''}`.toLowerCase();

      return nombreBlanco.includes(nombreBusqueda) || nombreNegro.includes(nombreBusqueda);
    });

    if (mesaEncontrada) {
      this.jugadorEncontrado = true;
      this.mesaJugadorId = mesaEncontrada.idMesa;

      setTimeout(() => {
        const elemento = document.getElementById(`mesa-${mesaEncontrada.idMesa}`);
        if (elemento) {
          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      this.mostrarToast('success', 'Jugador encontrado', 'El jugador está en este torneo');
    } else {
      this.jugadorEncontrado = false;
      this.mesaJugadorId = null;
      this.mostrarToast('info', 'Jugador no encontrado', 'El jugador no está participando en esta ronda');
    }
  }

  resetearBusqueda(): void {
    this.jugadorEncontrado = false;
    this.mesaJugadorId = null;
  }

  limpiarBusqueda(): void {
    this.nombreJugadorBusqueda = '';
    this.resetearBusqueda();
  }

  esJugadorBuscado(idJugador: number | undefined): boolean {
    if (!idJugador || !this.nombreJugadorBusqueda.trim()) {
      return false;
    }

    const mesa = this.mesasRonda.find(m =>
      m.idJugadorBlanco === idJugador || m.idJugadorNegro === idJugador
    );

    if (!mesa) return false;

    const nombreBusqueda = this.nombreJugadorBusqueda.trim().toLowerCase();

    if (mesa.idJugadorBlanco === idJugador) {
      const nombreCompleto = `${mesa.jugador_blanco?.nombre || ''} ${mesa.jugador_blanco?.apellido1 || ''}`.toLowerCase();
      return nombreCompleto.includes(nombreBusqueda);
    }

    if (mesa.idJugadorNegro === idJugador) {
      const nombreCompleto = `${mesa.jugador_negro?.nombre || ''} ${mesa.jugador_negro?.apellido1 || ''}`.toLowerCase();
      return nombreCompleto.includes(nombreBusqueda);
    }

    return false;
  }

  getMesasFinalizadas(): number {
    return this.mesasRonda.filter(m => m.estado === 'finalizada').length;
  }

  getMesaEstadoClase(estado: string): string {
    return `mesa-${estado}`;
  }

  getEstadoRondaClase(estado: string): string {
    return `status-${estado}`;
  }

  getTipoFinalizacionTexto(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'jaquemate': 'Jaque Mate',
      'tiempo': 'Por Tiempo',
      'rendicion': 'Rendición',
      'ilegales': 'Jugadas Ilegales',
      'incomparecencia': 'Incomparecencia',
      'empate_comun': 'Empate Común',
      'empate_material': 'Empate por Material',
      'empate_50_movidas': 'Empate 50 Movidas',
      'empate_triple_repeticion': 'Triple Repetición',
      'otro': 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();

    if (fechaStr.includes('T')) {
      const [datePart] = fechaStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      const [year, month, day] = fechaStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  formatearFechaHora(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  mostrarToast(tipo: 'success' | 'error' | 'warning' | 'info', titulo: string, mensaje?: string): void {
    if (this.toast) {
      this.toast.show(tipo, titulo, mensaje);
    }
  }

  reintentar(): void {
    this.error = null;
    this.cargarTorneos();
  }

  // ========== FUNCIONES PARA LISTA INICIAL ==========

cargarListaInicial(): void {
  if (!this.torneoSeleccionado?.idTorneo || !this.categoriaSeleccionada?.idTorneoCat) {
    return;
  }

  this.cargandoMesas = true;

  this.estadisticaService.getEstadisticasByTorneoCategoriaPublic(
    this.torneoSeleccionado.idTorneo,
    this.categoriaSeleccionada.idTorneoCat
  ).subscribe({
    next: (estadisticas) => {
      // NO mapear - usar directamente los datos que ya vienen formateados del backend
      this.listaInicial = estadisticas.sort((a, b) => (b.rating_torneo || 0) - (a.rating_torneo || 0));
      this.cargandoMesas = false;
    },
    error: (err) => {
      console.error('Error al cargar lista inicial:', err);
      this.listaInicial = [];
      this.cargandoMesas = false;
      this.mostrarToast('error', 'Error', 'No se pudo cargar la lista inicial');
    }
  });
}

  // ========== FUNCIONES PARA LISTA FINAL ==========

  cargarSistemasDesempate(): void {
    if (!this.categoriaSeleccionada) {
      this.sistemasDesempateActual = [];
      return;
    }

    const categoria = this.categorias.find(c => c.idTorneoCat === this.categoriaSeleccionada?.idTorneoCat);

    if (categoria && categoria.desempates && Array.isArray(categoria.desempates)) {
      this.sistemasDesempateActual = categoria.desempates;
    } else {
      this.sistemasDesempateActual = [];
    }
  }

  verificarRankingFinal(): void {
    if (!this.torneoSeleccionado?.idTorneo || !this.categoriaSeleccionada?.idTorneoCat) {
      return;
    }

    this.estadisticaService.getRankingFinalPublic(
      this.torneoSeleccionado.idTorneo,
      this.categoriaSeleccionada.idTorneoCat
    ).subscribe({
      next: (estadisticas) => {
        this.rankingFinalCargado = estadisticas.length > 0 &&
          estadisticas.some(est => est.posicion_actual !== null);
      },
      error: () => {
        this.rankingFinalCargado = false;
      }
    });
  }

  tieneRankingFinal(): boolean {
    if (!this.categoriaSeleccionada || this.rondasDisponibles.length === 0) {
      return false;
    }

    const todasFinalizadas = this.rondasDisponibles.every(r => r.estado === 'finalizada');

    return todasFinalizadas && this.rankingFinalCargado;
  }

  cargarListaFinal(): void {
    if (!this.torneoSeleccionado?.idTorneo || !this.categoriaSeleccionada?.idTorneoCat) {
      return;
    }

    this.cargandoMesas = true;

    this.estadisticaService.getRankingFinal(
      this.torneoSeleccionado.idTorneo,
      this.categoriaSeleccionada.idTorneoCat
    ).subscribe({
      next: (estadisticas) => {
        this.listaFinal = estadisticas
          .map(est => {
            let desempatesObj = {};

            if (est.desempates) {
              if (typeof est.desempates === 'string') {
                try {
                  desempatesObj = JSON.parse(est.desempates);
                } catch (e) {
                  console.warn('Error al parsear desempates:', e);
                  desempatesObj = {};
                }
              } else if (typeof est.desempates === 'object') {
                desempatesObj = est.desempates;
              }
            }

            return {
              ...est,
              desempates: desempatesObj
            };
          })
          .sort((a, b) => {
            if (a.posicion_actual && b.posicion_actual) {
              return a.posicion_actual - b.posicion_actual;
            }
            return b.puntos - a.puntos;
          });

        this.cargandoMesas = false;
      },
      error: (err) => {
        console.error('Error al cargar lista final:', err);
        this.listaFinal = [];
        this.cargandoMesas = false;
        this.mostrarToast('error', 'Error', 'No se encontró ranking final para esta categoría');
      }
    });
  }

  getValorDesempate(estadistica: EstadisticaTorneo, sistema: string): string | number {
    if (!estadistica.desempates || typeof estadistica.desempates !== 'object') {
      return '-';
    }

    const valor = (estadistica.desempates as any)[sistema];

    if (valor === null || valor === undefined) {
      return '-';
    }

    if (typeof valor === 'number') {
      return valor % 1 !== 0 ? valor.toFixed(1) : valor;
    }

    if (typeof valor === 'string') {
      const num = parseFloat(valor);
      if (!isNaN(num)) {
        return num % 1 !== 0 ? num.toFixed(1) : num;
      }
      return valor;
    }

    return valor;
  }
}