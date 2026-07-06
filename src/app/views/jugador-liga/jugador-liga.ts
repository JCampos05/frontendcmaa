import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { InfoLigaService } from '../../services/info-liga';
import { GrupoLigaService } from '../../services/grupo-liga';
import { RondaLigaService } from '../../services/ronda-liga';
import { MesaLigaService } from '../../services/mesa-liga';
import { ToastNoti } from '../../componentes/modales/toast-noti/toast-noti';

import { InfoLiga } from '../../models/infoLiga';
import { GrupoLiga } from '../../models/grupoLiga';
import { RondaLiga } from '../../models/rondaLiga';
import { MesaLiga } from '../../models/mesaLiga';
import { JugadorLiga } from '../../models/jugadorLiga';

@Component({
  selector: 'app-jugador-liga',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToastNoti
  ],
  templateUrl: './jugador-liga.html',
  styleUrls: ['./jugador-liga.css']
})
export class JugadorLigaComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  // Datos
  ligas: InfoLiga[] = [];
  ligaSeleccionada: InfoLiga | null = null;
  grupos: GrupoLiga[] = [];
  grupoSeleccionado: GrupoLiga | null = null;
  rondasDisponibles: RondaLiga[] = [];
  rondaSeleccionada: number | null = 0;
  rondaActualData: RondaLiga | null = null;
  mesasRonda: MesaLiga[] = [];

  // Tabla de posiciones
  tablaPosiciones: JugadorLiga[] = [];
  sistemasDesempateActual: string[] = [];

  // Búsqueda de jugador
  nombreJugadorBusqueda: string = '';
  jugadorEncontrado: boolean = false;
  mesaJugadorId: number | null = null;
  jugadorEncontradoTabla: boolean = false;
  jugadorIdEncontrado: number | null = null;
  busquedaRealizada: boolean = false;

  // Estados
  cargandoLigas = false;
  cargandoGrupos = false;
  cargandoRondas = false;
  cargandoMesas = false;
  cargandoTabla = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private infoLigaService: InfoLigaService,
    private grupoLigaService: GrupoLigaService,
    private rondaLigaService: RondaLigaService,
    private mesaLigaService: MesaLigaService
  ) { }

  ngOnInit(): void {
    this.cargarLigas();

    this.route.queryParams.subscribe(params => {
      if (params['liga']) {
        const idLiga = parseInt(params['liga']);
        if (!isNaN(idLiga)) {
          setTimeout(() => {
            const liga = this.ligas.find(l => l.idLiga === idLiga);
            if (liga) {
              this.ligaSeleccionada = liga;
              this.onLigaChange();
            }
          }, 500);
        }
      }
    });
  }

  cargarLigas(): void {
    this.cargandoLigas = true;
    this.error = null;

    this.infoLigaService.getTodasPublico().subscribe({
      next: (ligas) => {
        this.ligas = ligas || [];
        this.cargandoLigas = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las ligas';
        this.cargandoLigas = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las ligas');
      }
    });
  }

  onLigaChange(): void {
    this.grupoSeleccionado = null;
    this.grupos = [];
    this.rondasDisponibles = [];
    this.rondaSeleccionada = 0;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.tablaPosiciones = [];
    this.sistemasDesempateActual = [];
    this.resetearBusqueda();

    if (this.ligaSeleccionada?.idLiga) {
      this.cargarGrupos(this.ligaSeleccionada.idLiga);
    }
  }

  cargarGrupos(idLiga: number): void {
    this.cargandoGrupos = true;

    this.grupoLigaService.getByLigaPublico(idLiga).subscribe({
      next: (grupos) => {
        this.grupos = grupos || [];
        this.cargandoGrupos = false;
      },
      error: (err) => {
        this.cargandoGrupos = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar los grupos');
      }
    });
  }

  onGrupoChange(): void {
    this.rondaSeleccionada = 0;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.rondasDisponibles = [];
    this.tablaPosiciones = [];
    this.sistemasDesempateActual = [];
    this.resetearBusqueda();

    if (this.grupoSeleccionado && this.ligaSeleccionada?.idLiga) {
      const idGrupo = this.grupoSeleccionado.idGrupoLiga;

      if (idGrupo) {
        this.cargarRondas(idGrupo);
        this.cargarSistemasDesempate();
        this.cargarTablaPosiciones();
      }
    }
  }

  cargarRondas(idGrupo: number): void {
    this.cargandoRondas = true;

    this.rondaLigaService.getByGrupoPublico(idGrupo).subscribe({
      next: (rondas) => {
        this.rondasDisponibles = Array.isArray(rondas)
          ? rondas.sort((a, b) => a.numeroRonda - b.numeroRonda)
          : [];

        this.cargandoRondas = false;
      },
      error: (err) => {
        this.rondasDisponibles = [];
        this.cargandoRondas = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las rondas');
      }
    });
  }

  onRondaChange(): void {
    this.resetearBusqueda();
    this.mesasRonda = [];
    this.rondaActualData = null;
    this.tablaPosiciones = [];

    if (this.rondaSeleccionada === 0) {
      this.cargarTablaPosiciones();
      return;
    }

    if (this.rondaSeleccionada) {
      const ronda = this.rondasDisponibles.find(
        r => r.numeroRonda === this.rondaSeleccionada
      );

      if (ronda && ronda.idRondaLiga) {
        this.rondaActualData = ronda;
        this.cargarMesasRonda(ronda.idRondaLiga);
      }
    }
  }

  cargarMesasRonda(idRonda: number): void {
    this.cargandoMesas = true;

    this.mesaLigaService.getByRondaPublico(idRonda).subscribe({
      next: (mesas) => {
        this.mesasRonda = Array.isArray(mesas) ? mesas : [];
        this.cargandoMesas = false;
        this.cargandoRondas = false;

        if (this.nombreJugadorBusqueda.trim()) {
          this.buscarJugador();
        }
      },
      error: (err) => {
        this.mesasRonda = [];
        this.cargandoMesas = false;
        this.cargandoRondas = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las mesas');
      }
    });
  }

  cargarTablaPosiciones(): void {
    if (!this.grupoSeleccionado?.idGrupoLiga) {
      return;
    }

    this.cargandoTabla = true;

    this.grupoLigaService.getTablaPublico(this.grupoSeleccionado.idGrupoLiga).subscribe({
      next: (response) => {
        this.tablaPosiciones = response.tabla || [];
        this.cargandoTabla = false;
      },
      error: (err) => {
        this.tablaPosiciones = [];
        this.cargandoTabla = false;
        this.mostrarToast('error', 'Error', 'No se pudo cargar la tabla de posiciones');
      }
    });
  }

  cargarSistemasDesempate(): void {
    if (!this.grupoSeleccionado) {
      this.sistemasDesempateActual = [];
      return;
    }

    const grupo = this.grupos.find(g => g.idGrupoLiga === this.grupoSeleccionado?.idGrupoLiga);

    if (grupo && grupo.desempates && Array.isArray(grupo.desempates)) {
      this.sistemasDesempateActual = grupo.desempates;
    } else {
      this.sistemasDesempateActual = [];
    }
  }

  buscarJugador(): void {
    const nombreBusqueda = this.nombreJugadorBusqueda.trim().toLowerCase();

    if (!nombreBusqueda) {
      this.resetearBusqueda();
      return;
    }

    this.busquedaRealizada = true;

    // Búsqueda en Tabla de Posiciones
    if (this.rondaSeleccionada === 0 && this.tablaPosiciones.length > 0) {
      const jugadorEncontrado = this.tablaPosiciones.find(jl => {
        const nombreCompleto = `${jl.jugador?.nombre || ''} ${jl.jugador?.apellido1 || ''} ${jl.jugador?.apellido2 || ''}`.toLowerCase();
        return nombreCompleto.includes(nombreBusqueda);
      });

      if (jugadorEncontrado) {
        this.jugadorEncontradoTabla = true;
        this.jugadorIdEncontrado = jugadorEncontrado.jugador?.idJugador || null;

        setTimeout(() => {
          const elemento = document.getElementById(`jugador-${jugadorEncontrado.jugador?.idJugador}`);
          if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        this.mostrarToast('success', 'Jugador encontrado', 'El jugador está en la tabla de posiciones');
      } else {
        this.jugadorEncontradoTabla = false;
        this.jugadorIdEncontrado = null;
        this.mostrarToast('info', 'Jugador no encontrado', 'El jugador no está en la tabla');
      }
      return;
    }

    // Búsqueda en Mesas de Ronda
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
      this.mesaJugadorId = mesaEncontrada.idMesaLiga || null;

      setTimeout(() => {
        const elemento = document.getElementById(`mesa-${mesaEncontrada.idMesaLiga}`);
        if (elemento) {
          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      this.mostrarToast('success', 'Jugador encontrado', 'El jugador está en esta ronda');
    } else {
      this.jugadorEncontrado = false;
      this.mesaJugadorId = null;
      this.mostrarToast('info', 'Jugador no encontrado', 'El jugador no está participando en esta ronda');
    }
  }

  resetearBusqueda(): void {
    this.jugadorEncontrado = false;
    this.mesaJugadorId = null;
    this.jugadorEncontradoTabla = false;
    this.jugadorIdEncontrado = null;
    this.busquedaRealizada = false;
  }

  limpiarBusqueda(): void {
    this.nombreJugadorBusqueda = '';
    this.resetearBusqueda();
  }

  esJugadorBuscadoTabla(idJugador: number | undefined): boolean {
    if (!idJugador || !this.nombreJugadorBusqueda.trim()) {
      return false;
    }
    return this.jugadorIdEncontrado === idJugador;
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

  getValorDesempate(jugadorLiga: JugadorLiga, sistema: string): string | number {
    if (!jugadorLiga.desempates || typeof jugadorLiga.desempates !== 'object') {
      return '-';
    }

    const valor = (jugadorLiga.desempates as any)[sistema];

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

  mostrarToast(tipo: 'success' | 'error' | 'warning' | 'info', titulo: string, mensaje?: string): void {
    if (this.toast) {
      this.toast.show(tipo, titulo, mensaje);
    }
  }

  reintentar(): void {
    this.error = null;
    this.cargarLigas();
  }
}
