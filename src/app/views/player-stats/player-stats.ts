import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { JugadorService } from '../../services/jugador/jugador';
import { JugadorLigaService } from '../../services/jugadorLiga/jugador-liga';

import { InfoLiga } from '../../models/infoLiga';
import { GrupoLiga } from '../../models/grupoLiga';
import { JugadorLiga } from '../../models/jugadorLiga';

interface JugadorResultado {
  idJugador: number;
  nombre: string;
  apellido1: string;
  apellido2?: string;
  rating: number;
  estado?: string;
  pago_confirmado?: boolean | null;
  estado_inscripcion?: string | null;
}

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './player-stats.html',
  styleUrls: ['./player-stats.css']
})
export class PlayerStatsComponent implements OnInit {
  searchNombre: string = '';
  searchApellido1: string = '';
  searchApellido2: string = '';
  buscando: boolean = false;
  resultadosBusqueda: JugadorResultado[] = [];
  sinResultados: boolean = false;

  jugadorSeleccionado: any = null;
  cargandoStats: boolean = false;
  errorStats: string = '';

  tabActivo: 'ultimo' | 'historial' | 'ligas' = 'ultimo';

  // Nuevas propiedades para torneos separados
  torneosPasados: any[] = [];
  torneosFuturos: any[] = [];

  // Nuevas propiedades para ligas
  ligasActivas: any[] = [];
  ligasPasadas: any[] = [];
  ligasFuturas: any[] = [];

  constructor(
    private jugadorService: JugadorService,
    private jugadorLigaService: JugadorLigaService
  ) { }

  ngOnInit(): void { }

  buscarJugadores(): void {
    if (!this.searchNombre.trim() && !this.searchApellido1.trim()) {
      return;
    }

    this.buscando = true;
    this.sinResultados = false;
    this.jugadorSeleccionado = null;
    this.errorStats = '';

    this.jugadorService.search(
      this.searchNombre.trim() || undefined,
      this.searchApellido1.trim() || undefined,
      this.searchApellido2.trim() || undefined
    ).subscribe({
      next: (jugadores: any) => {
        this.resultadosBusqueda = jugadores;
        this.sinResultados = jugadores.length === 0;
        this.buscando = false;
      },
      error: (error) => {
        this.buscando = false;
        this.sinResultados = true;
        this.errorStats = 'Error al buscar jugadores. Por favor intenta de nuevo.';
      }
    });
  }

  seleccionarJugador(jugador: JugadorResultado): void {
    this.cargandoStats = true;
    this.errorStats = '';

    this.jugadorService.getPublicStats(jugador.idJugador).subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);
        console.log('Ligas en los datos:', data.ligas);
        
        this.jugadorSeleccionado = data;
        
        // Separar torneos en pasados y futuros
        this.separarTorneos();
        
        // Separar ligas por estado
        this.separarLigas();
        
        this.cargandoStats = false;
        this.resultadosBusqueda = [];
        this.sinResultados = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.errorStats = 'No se pudieron cargar las estadísticas del jugador';
        this.cargandoStats = false;
      }
    });
  }

  /**
   * Separa los torneos en pasados y futuros según la fecha actual
   */
  separarTorneos(): void {
    if (!this.jugadorSeleccionado || !this.jugadorSeleccionado.historial) {
      this.torneosPasados = [];
      this.torneosFuturos = [];
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación justa

    this.torneosPasados = [];
    this.torneosFuturos = [];

    this.jugadorSeleccionado.historial.forEach((participacion: any) => {
      const fechaTorneo = new Date(participacion.torneo.fecha);
      fechaTorneo.setHours(0, 0, 0, 0);

      if (fechaTorneo < hoy) {
        this.torneosPasados.push(participacion);
      } else {
        this.torneosFuturos.push(participacion);
      }
    });

    // Ordenar pasados: más reciente primero (descendente)
    this.torneosPasados.sort((a, b) => {
      const fechaA = new Date(a.torneo.fecha).getTime();
      const fechaB = new Date(b.torneo.fecha).getTime();
      return fechaB - fechaA;
    });

    // Ordenar futuros: más próximo primero (ascendente)
    this.torneosFuturos.sort((a, b) => {
      const fechaA = new Date(a.torneo.fecha).getTime();
      const fechaB = new Date(b.torneo.fecha).getTime();
      return fechaA - fechaB;
    });
  }

  /**
   * Determina si un torneo es pasado o futuro
   */
  esTorneoPasado(fecha: Date | string): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaTorneo = new Date(fecha);
    fechaTorneo.setHours(0, 0, 0, 0);
    
    return fechaTorneo < hoy;
  }

  /**
   * Separa las ligas en activas, futuras y pasadas según las fechas
   */
  separarLigas(): void {
    if (!this.jugadorSeleccionado || !this.jugadorSeleccionado.ligas) {
      this.ligasActivas = [];
      this.ligasPasadas = [];
      this.ligasFuturas = [];
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    this.ligasActivas = [];
    this.ligasPasadas = [];
    this.ligasFuturas = [];

    this.jugadorSeleccionado.ligas.forEach((participacionLiga: any) => {
      const fechaInicio = new Date(participacionLiga.liga.fecha_inicio);
      const fechaFin = participacionLiga.liga.fecha_fin ? new Date(participacionLiga.liga.fecha_fin) : null;
      
      fechaInicio.setHours(0, 0, 0, 0);
      if (fechaFin) {
        fechaFin.setHours(0, 0, 0, 0);
      }

      // Liga futura: aún no ha comenzado
      if (fechaInicio > hoy) {
        this.ligasFuturas.push(participacionLiga);
      }
      // Liga pasada: ya terminó
      else if (fechaFin && fechaFin < hoy) {
        this.ligasPasadas.push(participacionLiga);
      }
      // Liga activa: está en curso
      else {
        this.ligasActivas.push(participacionLiga);
      }
    });

    // Ordenar activas: más reciente primero
    this.ligasActivas.sort((a, b) => {
      const fechaA = new Date(a.liga.fecha_inicio).getTime();
      const fechaB = new Date(b.liga.fecha_inicio).getTime();
      return fechaB - fechaA;
    });

    // Ordenar pasadas: más reciente primero
    this.ligasPasadas.sort((a, b) => {
      const fechaA = new Date(a.liga.fecha_inicio).getTime();
      const fechaB = new Date(b.liga.fecha_inicio).getTime();
      return fechaB - fechaA;
    });

    // Ordenar futuras: más próxima primero
    this.ligasFuturas.sort((a, b) => {
      const fechaA = new Date(a.liga.fecha_inicio).getTime();
      const fechaB = new Date(b.liga.fecha_inicio).getTime();
      return fechaA - fechaB;
    });
  }

  cambiarTab(tab: 'ultimo' | 'historial' | 'ligas'): void {
    this.tabActivo = tab;
  }

  nuevaBusqueda(): void {
    this.jugadorSeleccionado = null;
    this.searchNombre = '';
    this.searchApellido1 = '';
    this.searchApellido2 = '';
    this.resultadosBusqueda = [];
    this.sinResultados = false;
    this.torneosPasados = [];
    this.torneosFuturos = [];
    this.ligasActivas = [];
    this.ligasPasadas = [];
    this.ligasFuturas = [];
  }

  formatearFecha(fecha: string | Date): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getNombreCompleto(jugador: any): string {
    return `${jugador.nombre} ${jugador.apellido1}${jugador.apellido2 ? ' ' + jugador.apellido2 : ''}`;
  }

  getEstadoLabel(estado: string): string {
    const estados: { [key: string]: string } = {
      'activo': 'Activo',
      'inactivo': 'Inactivo',
      'retirado': 'Retirado'
    };
    return estados[estado] || 'Activo';
  }

  getEstadoClass(estado: string): string {
    return `estado-${estado || 'activo'}`;
  }

  getPagoLabel(pagoConfirmado: boolean | null | undefined): string {
    if (pagoConfirmado === null || pagoConfirmado === undefined) return '';
    return pagoConfirmado ? 'Pago Confirmado' : 'Pago Pendiente';
  }

  getPagoClass(pagoConfirmado: boolean | null | undefined): string {
    if (pagoConfirmado === null || pagoConfirmado === undefined) return '';
    return pagoConfirmado ? 'pago-confirmado' : 'pago-pendiente';
  }

  getPagoIcon(pagoConfirmado: boolean | null | undefined): string {
    if (pagoConfirmado === null || pagoConfirmado === undefined) return '';
    return pagoConfirmado ? 'fa-circle-check' : 'fa-circle-xmark';
  }

  /**
   * Formatea rango de fechas para ligas
   */
  formatearRangoFechas(fechaInicio: string | Date, fechaFin?: string | Date | null): string {
    const inicio = new Date(fechaInicio);
    const inicioStr = inicio.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    if (!fechaFin) {
      return `Desde ${inicioStr}`;
    }

    const fin = new Date(fechaFin);
    const finStr = fin.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    return `${inicioStr} - ${finStr}`;
  }

  /**
   * Obtiene el estado visual de la liga
   */
  getEstadoLiga(participacion: any): { texto: string; clase: string; icono: string } {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = new Date(participacion.liga.fecha_inicio);
    const fechaFin = participacion.liga.fecha_fin ? new Date(participacion.liga.fecha_fin) : null;
    
    fechaInicio.setHours(0, 0, 0, 0);
    if (fechaFin) {
      fechaFin.setHours(0, 0, 0, 0);
    }

    // Futuras
    if (fechaInicio > hoy) {
      return { texto: 'Por Comenzar', clase: 'futura', icono: 'fa-hourglass-half' };
    }
    
    // Pasadas
    if (fechaFin && fechaFin < hoy) {
      return { texto: 'Finalizada', clase: 'pasada', icono: 'fa-flag-checkered' };
    }
    
    // Activas
    return { texto: 'En Curso', clase: 'activa', icono: 'fa-circle-play' };
  }
}