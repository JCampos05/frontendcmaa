import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { TorneoService } from '../../services/torneo/torneo';
import { RondaService } from '../../services/ronda/ronda';
import { MesaService } from '../../services/mesa/mesa';
import { ToastNoti } from '../../componentes/modales/toast-noti/toast-noti';

import { Torneo } from '../../models/torneo';
import { TorneoCategoria } from '../../models/torneo-categoria';
import { Ronda } from '../../models/ronda';
import { Mesa } from '../../models/mesa';

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
  rondaSeleccionada: number | null = null;
  rondaActualData: Ronda | null = null;
  mesasRonda: Mesa[] = [];

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
    private mesaService: MesaService
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
    this.rondaSeleccionada = null;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.resetearBusqueda();

    if (this.torneoSeleccionado?.idTorneo) {
      this.cargarCategorias(this.torneoSeleccionado.idTorneo);
    }
  }

  cargarCategorias(idTorneo: number): void {
    this.cargandoCategorias = true;

    this.torneoService.getCategoriasByTorneo(idTorneo).subscribe({
      next: (response) => {
        this.categorias = response.categorias || [];
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
    this.rondaSeleccionada = null;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.rondasDisponibles = [];
    this.resetearBusqueda();

    if (this.categoriaSeleccionada && this.torneoSeleccionado?.idTorneo) {
      const idCategoria = this.categoriaSeleccionada.idCategoria;

      if (idCategoria) {
        this.cargarRondas(this.torneoSeleccionado.idTorneo, idCategoria);
      }
    }
  }

  cargarRondas(idTorneo: number, idCategoria: number): void {
    this.cargandoRondas = true;

    this.rondaService.getRondasByTorneo(idTorneo).subscribe({
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

        if (this.rondasDisponibles.length > 0) {
          const ultimaRonda = this.rondasDisponibles[this.rondasDisponibles.length - 1];
          this.rondaSeleccionada = ultimaRonda.numeroRonda;
          this.rondaActualData = ultimaRonda;
          this.cargarMesasRonda(ultimaRonda.idRonda);
        } else {
          this.cargandoRondas = false;
        }
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
    this.resetearBusqueda();
    
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
    
    this.mesaService.getMesasByRonda(idRonda).subscribe({
      next: (mesas) => {
        this.mesasRonda = Array.isArray(mesas) ? mesas : [];
        this.cargandoMesas = false;
        this.cargandoRondas = false;
        
        // Si hay búsqueda activa, buscar nuevamente
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

    // Buscar en las mesas
    const mesaEncontrada = this.mesasRonda.find(mesa => {
      const nombreBlanco = `${mesa.jugador_blanco?.nombre || ''} ${mesa.jugador_blanco?.apellido1 || ''}`.toLowerCase();
      const nombreNegro = `${mesa.jugador_negro?.nombre || ''} ${mesa.jugador_negro?.apellido1 || ''}`.toLowerCase();
      
      return nombreBlanco.includes(nombreBusqueda) || nombreNegro.includes(nombreBusqueda);
    });

    if (mesaEncontrada) {
      this.jugadorEncontrado = true;
      this.mesaJugadorId = mesaEncontrada.idMesa;
      
      // Scroll automático a la mesa
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
}