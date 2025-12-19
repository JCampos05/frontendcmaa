import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { JugadorService } from '../../../services/jugador/jugador';
import { TorneoService } from '../../../services/torneo/torneo';
import { InscripcionService } from '../../../services/inscripcion/inscripcion';
import { PartidaService } from '../../../services/partida/partida';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

import { Jugador } from '../../../models/jugador';
import { Torneo } from '../../../models/torneo';
import { Inscripcion } from '../../../models/inscripcion';
import { Partida } from '../../../models/partida';

interface HistorialTorneo {
  torneo: Torneo;
  inscripcion: Inscripcion;
  partidas: PartidaDetalle[];
  estadisticas: {
    victorias: number;
    empates: number;
    derrotas: number;
    puntos: number;
  };
}

interface PartidaDetalle {
  numeroRonda: number;
  numeroMesa: number;
  color: 'blanco' | 'negro';
  rival: string;
  ratingRival: number;
  resultado: string;
  puntosObtenidos: number;
  tipoFinalizacion?: string;
}

@Component({
  selector: 'app-gestion-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNoti],
  templateUrl: './gestion-jugadores.html',
  styleUrls: ['./gestion-jugadores.css']
})
export class GestionJugadoresComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  // Búsqueda
  nombreBusqueda = '';
  apellido1Busqueda = '';
  apellido2Busqueda = '';
  resultadosBusqueda: Jugador[] = [];
  buscando = false;

  // Jugador seleccionado
  jugadorSeleccionado: Jugador | null = null;
  modoEdicion = false;
  jugadorEditado: Partial<Jugador> = {};

  // Historial
  historialTorneos: HistorialTorneo[] = [];
  torneoSeleccionado: number | null = null;
  cargandoHistorial = false;

  // Estados
  cargando = false;
  error: string | null = null;

  constructor(
    private jugadorService: JugadorService,
    private torneoService: TorneoService,
    private inscripcionService: InscripcionService,
    private partidaService: PartidaService,
    private router: Router
  ) { }

  ngOnInit(): void { }

  buscarJugador(): void {
    if (!this.nombreBusqueda && !this.apellido1Busqueda) {
      this.toast.warning('Atención', 'Ingrese al menos un nombre o apellido');
      return;
    }

    this.buscando = true;
    this.error = null;

    this.jugadorService.search(
      this.nombreBusqueda,
      this.apellido1Busqueda,
      this.apellido2Busqueda
    ).subscribe({
      next: (jugadores) => {
        this.resultadosBusqueda = jugadores;
        this.toast.success('Búsqueda exitosa', `${jugadores.length} jugadores encontrados`);

        if (jugadores.length === 0) {
          this.toast.warning('Atención', 'No se encontraron jugadores con estos criterios');
        } else if (jugadores.length === 1) {
          this.seleccionarJugador(jugadores[0]);
        }

        this.buscando = false;
      },
      error: (err) => {
        console.error('Error al buscar jugador:', err);
        this.error = 'Error al realizar la búsqueda';
        this.buscando = false;
        this.toast.error('Error', 'No se pudo realizar la búsqueda');
      }
    });
  }

  seleccionarJugador(jugador: Jugador): void {
    this.resultadosBusqueda = [];

    // Cargar los datos completos del jugador
    if (jugador.idJugador) {
      this.cargando = true;
      this.jugadorService.getFullById(jugador.idJugador).subscribe({
        next: (jugadorCompleto) => {
          console.log('Jugador completo cargado:', jugadorCompleto);
          this.jugadorSeleccionado = jugadorCompleto;
          this.cargando = false;
          this.cargarHistorialJugador(jugador.idJugador!);
        },
        error: (err) => {
          console.error('Error','Error al cargar jugador completo:', err);
          // Fallback: usar los datos parciales de la búsqueda
          this.jugadorSeleccionado = jugador;
          this.cargando = false;
          this.cargarHistorialJugador(jugador.idJugador!);
          this.mostrarToast('warning', 'Advertencia', 'No se pudieron cargar todos los datos del jugador');
        }
      });
    }
  }

  cargarHistorialJugador(idJugador: number): void {
    this.cargandoHistorial = true;
    this.historialTorneos = [];

    console.log('=== CARGANDO HISTORIAL DEL JUGADOR ===', idJugador);

    this.jugadorService.getPublicStats(idJugador).subscribe({
      next: (data) => {
        console.log('📥 Datos recibidos de getPublicStats:', data);

        // Los datos vienen directamente, no hay doble envoltura
        const historial = data.historial || [];
        console.log('📋 Historial extraído:', historial.length, 'inscripciones');

        if (historial.length === 0) {
          console.log('⚠️ No hay inscripciones en el historial');
          this.cargandoHistorial = false;
          return;
        }

        // Contador para saber cuándo terminamos de cargar todas las partidas
        let torneosPendientes = historial.length;
        console.log(`🔄 Procesando ${torneosPendientes} torneos...`);

        historial.forEach((insc: any, index: number) => {
          console.log(`\n📌 Inscripción ${index + 1}:`, {
            idInscripcion: insc.idInscripcion,
            torneo: insc.torneo?.nombre || insc.torneo?.lugar,
            idTorneo: insc.torneo?.idTorneo,
            categoria: insc.categoria?.nombre
          });

          if (insc.torneo && insc.torneo.idTorneo) {
            this.cargarPartidasTorneo(idJugador, insc, () => {
              torneosPendientes--;
              console.log(`✅ Torneo procesado. Pendientes: ${torneosPendientes}`);
              if (torneosPendientes === 0) {
                this.cargandoHistorial = false;
                console.log('🎉 Historial completo cargado:', this.historialTorneos.length, 'torneos');
              }
            });
          } else {
            console.warn('⚠️ Inscripción sin torneo válido:', insc);
            torneosPendientes--;
            if (torneosPendientes === 0) {
              this.cargandoHistorial = false;
            }
          }
        });

        // Si no hay torneos para procesar, desactivar loading
        if (torneosPendientes === 0) {
          this.cargandoHistorial = false;
        }
      },
      error: (err) => {
        //console.error('❌ Error al cargar historial:', err);
        this.cargandoHistorial = false;
        this.mostrarToast('error', 'Error', 'No se pudo cargar el historial');
      }
    });
  }

  cargarPartidasTorneo(idJugador: number, inscripcion: any, callback?: () => void): void {
    const idTorneo = inscripcion.torneo.idTorneo;

    console.log('Cargando partidas para torneo:', idTorneo);

    this.partidaService.getPartidasByJugadorTorneo(idJugador, idTorneo).subscribe({
      next: (partidas) => {
        console.log('Partidas recibidas:', partidas);

        const partidasDetalle = this.procesarPartidas(partidas, idJugador);

        const stats = {
          victorias: partidasDetalle.filter(p => p.puntosObtenidos === 1).length,
          empates: partidasDetalle.filter(p => p.puntosObtenidos === 0.5).length,
          derrotas: partidasDetalle.filter(p => p.puntosObtenidos === 0).length,
          puntos: partidasDetalle.reduce((sum, p) => sum + p.puntosObtenidos, 0)
        };

        console.log('Estadísticas calculadas:', stats);

        const historialTorneo: HistorialTorneo = {
          torneo: inscripcion.torneo,
          inscripcion: inscripcion,
          partidas: partidasDetalle,
          estadisticas: stats
        };

        this.historialTorneos.push(historialTorneo);

        // Ordenar por fecha descendente
        this.historialTorneos.sort((a, b) => {
          return new Date(b.torneo.fecha).getTime() - new Date(a.torneo.fecha).getTime();
        });

        console.log('Historial actualizado:', this.historialTorneos);

        if (callback) {
          callback();
        }
      },
      error: (err) => {
        console.error('Error al cargar partidas del torneo:', idTorneo, err);

        // Aún así agregar el torneo sin partidas
        const historialTorneo: HistorialTorneo = {
          torneo: inscripcion.torneo,
          inscripcion: inscripcion,
          partidas: [],
          estadisticas: {
            victorias: 0,
            empates: 0,
            derrotas: 0,
            puntos: 0
          }
        };

        this.historialTorneos.push(historialTorneo);

        if (callback) {
          callback();
        }
      }
    });
  }

  procesarPartidas(partidas: Partida[], idJugador: number): PartidaDetalle[] {
    return partidas.map((partida) => {
      const mesa = partida.mesa;
      const ronda = mesa?.ronda;
      const esBlanco = mesa?.idJugadorBlanco === idJugador;
      const rival = esBlanco ? mesa?.jugador_negro : mesa?.jugador_blanco;

      let puntosObtenidos = 0;
      if (partida.resultado === '1-0') {
        puntosObtenidos = esBlanco ? 1 : 0;
      } else if (partida.resultado === '0-1') {
        puntosObtenidos = esBlanco ? 0 : 1;
      } else if (partida.resultado === '0.5-0.5') {
        puntosObtenidos = 0.5;
      }

      const color: 'blanco' | 'negro' = esBlanco ? 'blanco' : 'negro';

      return {
        numeroRonda: ronda?.numeroRonda || 0,
        numeroMesa: mesa?.numeroMesa || 0,
        color: color,
        rival: `${rival?.nombre} ${rival?.apellido1} ${rival?.apellido2 || ''}`.trim(),
        ratingRival: rival?.rating || 0,
        resultado: partida.resultado,
        puntosObtenidos,
        tipoFinalizacion: partida.tipo_finalizacion
      };
    }).sort((a, b) => a.numeroRonda - b.numeroRonda);
  }

  activarEdicion(): void {
    if (!this.jugadorSeleccionado) return;

    this.modoEdicion = true;
    this.jugadorEditado = { ...this.jugadorSeleccionado };
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.jugadorEditado = {};
  }

  guardarCambios(): void {
    if (!this.jugadorSeleccionado?.idJugador) return;

    this.cargando = true;
    const idJugador = this.jugadorSeleccionado.idJugador;

    this.jugadorService.update(idJugador, this.jugadorEditado).subscribe({
      next: (jugadorActualizado) => {
        // Recargar el jugador completo desde el servidor con el nuevo endpoint
        this.jugadorService.getFullById(idJugador).subscribe({
          next: (jugadorCompleto) => {
            console.log('Jugador completo recibido:', jugadorCompleto);
            this.jugadorSeleccionado = jugadorCompleto;
            this.modoEdicion = false;
            this.jugadorEditado = {};
            this.cargando = false;
            this.mostrarToast('success', 'Éxito', 'Jugador actualizado correctamente');
          },
          error: (err) => {
            console.error('Error al recargar jugador:', err);
            this.cargando = false;
            this.mostrarToast('error', 'Error', 'No se pudo recargar el jugador');
          }
        });
      },
      error: (err) => {
        console.error('Error al actualizar jugador:', err);
        this.cargando = false;
        this.mostrarToast('error', 'Error', 'No se pudo actualizar el jugador');
      }
    });
  }

  seleccionarTorneo(idTorneo: number): void {
    this.torneoSeleccionado = this.torneoSeleccionado === idTorneo ? null : idTorneo;
  }

  limpiarBusqueda(): void {
    this.nombreBusqueda = '';
    this.apellido1Busqueda = '';
    this.apellido2Busqueda = '';
    this.resultadosBusqueda = [];
    this.jugadorSeleccionado = null;
    this.historialTorneos = [];
    this.modoEdicion = false;
  }

  getResultadoClase(puntosObtenidos: number): string {
    if (puntosObtenidos === 1) return 'resultado-victoria';
    if (puntosObtenidos === 0.5) return 'resultado-empate';
    return 'resultado-derrota';
  }

  getResultadoTexto(puntosObtenidos: number): string {
    if (puntosObtenidos === 1) return 'Victoria';
    if (puntosObtenidos === 0.5) return 'Empate';
    return 'Derrota';
  }

  getTipoFinalizacionTexto(tipo?: string): string {
    if (!tipo) return '';

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
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
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

  mostrarToast(tipo: 'success' | 'error' | 'warning' | 'info', titulo: string, mensaje?: string): void {
    if (this.toast) {
      this.toast.show(tipo, titulo, mensaje);
    }
  }

  volver(): void {
    this.router.navigate(['/main-view']);
  }
}