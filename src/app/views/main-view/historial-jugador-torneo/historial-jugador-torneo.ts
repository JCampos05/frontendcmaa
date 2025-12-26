import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { TorneoService } from '../../../services/torneo/torneo';
import { PartidaService } from '../../../services/partida/partida';
import { EstadisticaTorneoService } from '../../../services/estadistica-torneo/estadistica-torneo';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

import { Torneo } from '../../../models/torneo';
import { Partida } from '../../../models/partida';
import { EstadisticaTorneo } from '../../../models/estadistica-torneo';
import { TorneoCategoria } from '../../../models/torneo-categoria';

interface PartidaHistorial {
  numeroRonda: number;
  numeroMesa: number;
  color: 'blanco' | 'negro';
  rival: string;
  ratingRival: number;
  resultado: string;
  puntosObtenidos: number;
  puntosAcumulados: number;
  tipoFinalizacion?: string;
  categoria: string;
}

@Component({
  selector: 'app-historial-jugador',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNoti],
  templateUrl: './historial-jugador-torneo.html',
  styleUrls: ['./historial-jugador-torneo.css']
})
export class HistorialJugadorComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  // Datos de filtros
  torneos: Torneo[] = [];
  torneoSeleccionado: number | null = null;
  categorias: TorneoCategoria[] = [];
  categoriaSeleccionada: number | null = null;

  // Búsqueda y selección
  busquedaJugador: string = '';
  estadisticas: EstadisticaTorneo[] = [];
  jugadoresFiltrados: EstadisticaTorneo[] = [];
  jugadorSeleccionado: number | null = null;

  // Datos del jugador seleccionado
  estadisticaJugador: EstadisticaTorneo | null = null;
  partidasHistorial: PartidaHistorial[] = [];

  cargando = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private torneoService: TorneoService,
    private partidaService: PartidaService,
    private estadisticaService: EstadisticaTorneoService
  ) { }

  ngOnInit(): void {
    this.cargarTorneos();
  }

  cargarTorneos(): void {
    this.cargando = true;
    this.error = null;

    this.torneoService.getAll().subscribe({
      next: (torneos) => {
        this.torneos = torneos.sort((a, b) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar torneos:', err);
        this.error = 'Error al cargar la lista de torneos';
        this.cargando = false;
      }
    });
  }

  onTorneoChange(): void {
    this.categorias = [];
    this.categoriaSeleccionada = null;
    this.estadisticas = [];
    this.jugadoresFiltrados = [];
    this.jugadorSeleccionado = null;
    this.estadisticaJugador = null;
    this.partidasHistorial = [];
    this.busquedaJugador = '';

    if (this.torneoSeleccionado) {
      this.cargarCategorias();
      this.cargarJugadores();
    }
  }

  cargarCategorias(): void {
    if (!this.torneoSeleccionado) return;

    this.torneoService.getCategoriasByTorneo(this.torneoSeleccionado).subscribe({
      next: (response) => {
        this.categorias = response.categorias || [];
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  cargarJugadores(): void {
    if (!this.torneoSeleccionado) return;

    this.cargando = true;

    this.estadisticaService.getEstadisticasByTorneo(this.torneoSeleccionado).subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas || [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar jugadores:', err);
        this.estadisticas = [];
        this.jugadoresFiltrados = [];
        this.cargando = false;
      }
    });
  }

  onCategoriaChange(): void {
    this.jugadorSeleccionado = null;
    this.estadisticaJugador = null;
    this.partidasHistorial = [];
    this.busquedaJugador = '';
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let resultado = [...this.estadisticas];

    // Filtrar por categoría si está seleccionada
    if (this.categoriaSeleccionada) {
      resultado = resultado.filter(est =>
        est.idTorneoCategoria === this.categoriaSeleccionada
      );
    }

    // Ordenar por puntos
    resultado.sort((a, b) => b.puntos - a.puntos);

    this.jugadoresFiltrados = resultado;
  }

  filtrarJugadores(): void {
    const termino = this.busquedaJugador.toLowerCase().trim();

    if (!termino) {
      this.aplicarFiltros();
      return;
    }

    let resultado = [...this.estadisticas];

    // Filtrar por categoría si está seleccionada
    if (this.categoriaSeleccionada) {
      resultado = resultado.filter(est =>
        est.idTorneoCategoria === this.categoriaSeleccionada
      );
    }

    // Filtrar por búsqueda
    resultado = resultado.filter(est => {
      const nombreCompleto = `${est.jugador?.nombre} ${est.jugador?.apellido1} ${est.jugador?.apellido2 || ''}`.toLowerCase();
      return nombreCompleto.includes(termino);
    });

    this.jugadoresFiltrados = resultado;
  }

  seleccionarJugador(estadistica: EstadisticaTorneo): void {
    if (!estadistica.jugador?.idJugador || !this.torneoSeleccionado) return;

    this.jugadorSeleccionado = estadistica.jugador.idJugador;
    this.estadisticaJugador = estadistica;
    this.cargarPartidasJugador(estadistica.jugador.idJugador, this.torneoSeleccionado);
  }

  cargarPartidasJugador(idJugador: number, idTorneo: number): void {
    this.cargando = true;

    this.partidaService.getPartidasByJugadorTorneo(idJugador, idTorneo).subscribe({
      next: (partidas) => {
        this.procesarPartidas(partidas, idJugador);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar partidas:', err);
        this.partidasHistorial = [];
        this.cargando = false;
        this.toast.error('Error',' No se pudo cargar el historial de partidas');
      }
    });
  }

  procesarPartidas(partidas: Partida[], idJugador: number): void {
    let puntosAcumulados = 0;

    this.partidasHistorial = partidas.map((partida) => {
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

      puntosAcumulados += puntosObtenidos;

      return {
        numeroRonda: ronda?.numeroRonda || 0,
        numeroMesa: mesa?.numeroMesa || 0,
        color: esBlanco ? 'blanco' : 'negro',
        rival: `${rival?.nombre} ${rival?.apellido1} ${rival?.apellido2 || ''}`.trim(),
        ratingRival: rival?.rating || 0,
        resultado: partida.resultado,
        puntosObtenidos,
        puntosAcumulados,
        tipoFinalizacion: partida.tipo_finalizacion,
        categoria: ronda?.torneo_categoria?.categoria?.nombre || 'N/A'
      };
    });
  }

  getResultadoClase(partida: PartidaHistorial): string {
    if (partida.puntosObtenidos === 1) return 'resultado-victoria';
    if (partida.puntosObtenidos === 0.5) return 'resultado-empate';
    return 'resultado-derrota';
  }

  getResultadoTexto(partida: PartidaHistorial): string {
    if (partida.puntosObtenidos === 1) return 'Victoria';
    if (partida.puntosObtenidos === 0.5) return 'Empate';
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

  async exportarPDF(): Promise<void> {
    if (!this.estadisticaJugador) return;

    const doc = new jsPDF();

    try {
      const logoBase64 = await this.cargarImagenComoBase64('/LogoComite.jpg');
      const logoMarcaAgua = await this.aplicarOpacidad(logoBase64, 0.08);

      const jugador = this.estadisticaJugador.jugador;
      const nombreCompleto = `${jugador?.nombre} ${jugador?.apellido1} ${jugador?.apellido2 || ''}`.trim();
      const torneo = this.torneos.find(t => t.idTorneo === this.torneoSeleccionado);

      // Logo en el encabezado
      doc.addImage(logoBase64, 'JPEG', 14, 10, 25, 25);

      // Título y subtítulo
      doc.setFontSize(18);
      doc.setTextColor(99, 48, 23);
      doc.text('Historial de Partidas', 45, 20);

      doc.setFontSize(12);
      doc.setTextColor(133, 77, 46);
      doc.text(`Jugador: ${nombreCompleto}`, 45, 28);
      doc.text(`Torneo: ${torneo?.nombre || torneo?.lugar || 'N/A'}`, 45, 35);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Puntos Totales: ${this.estadisticaJugador.puntos} | Rating: ${jugador?.rating || 'S/R'}`, 45, 42);

      // Preparar datos para la tabla
      const data = this.partidasHistorial.map(p => [
        `R${p.numeroRonda}`,
        `M${p.numeroMesa}`,
        p.color === 'blanco' ? 'Blancas' : 'Negras',
        p.rival,
        p.ratingRival || 'S/R',
        this.getResultadoTexto(p),
        p.puntosObtenidos,
        p.puntosAcumulados
      ]);

      // Generar tabla con marca de agua
      autoTable(doc, {
        startY: 50,
        head: [['Ronda', 'Mesa', 'Color', 'Rival', 'Rating', 'Resultado', 'Pts', 'Acum.']],
        body: data,
        theme: 'striped',
        styles: {
          fontSize: 9,
          textColor: [17, 34, 57]
        },
        headStyles: {
          fillColor: [133, 77, 46],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246]
        },
        didDrawPage: (hookData) => {
          // Agregar marca de agua en todas las páginas
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const logoSize = 120;
          const xCenter = (pageWidth - logoSize) / 2;
          const yCenter = (pageHeight - logoSize) / 2 + 10;

          doc.addImage(logoMarcaAgua, 'PNG', xCenter, yCenter, logoSize, logoSize);
        }
      });

      // Guardar PDF
      doc.save(`historial_${nombreCompleto.replace(/\s+/g, '_')}.pdf`);
      this.toast.success('PDF generado','Archivo PDF creado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.toast.warning('Atención','Error. Creando PDF de respaldo');
      this.generarPDFSinLogo();
    }
  }

  private cargarImagenComoBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg');
            resolve(dataURL);
          } else {
            reject(new Error('No se pudo crear el contexto del canvas'));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error(`Error al cargar la imagen desde ${url}`));
      };

      img.src = url + '?t=' + new Date().getTime();
    });
  }

  private aplicarOpacidad(imagenBase64: string, opacidad: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = opacidad;
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } else {
          reject(new Error('No se pudo crear el contexto del canvas'));
        }
      };

      img.onerror = () => {
        reject(new Error('Error al aplicar opacidad'));
      };

      img.src = imagenBase64;
    });
  }

  private generarPDFSinLogo(): void {
    if (!this.estadisticaJugador) return;

    const doc = new jsPDF();
    const jugador = this.estadisticaJugador.jugador;
    const nombreCompleto = `${jugador?.nombre} ${jugador?.apellido1} ${jugador?.apellido2 || ''}`.trim();
    const torneo = this.torneos.find(t => t.idTorneo === this.torneoSeleccionado);

    doc.setFontSize(18);
    doc.setTextColor(99, 48, 23);
    doc.text('Historial de Partidas', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(133, 77, 46);
    doc.text(`Jugador: ${nombreCompleto}`, 14, 30);
    doc.text(`Torneo: ${torneo?.nombre || torneo?.lugar || 'N/A'}`, 14, 37);
    doc.text(`Puntos Totales: ${this.estadisticaJugador.puntos}`, 14, 44);
    doc.text(`Rating: ${jugador?.rating || 'S/R'}`, 14, 51);

    const data = this.partidasHistorial.map(p => [
      `R${p.numeroRonda}`,
      `M${p.numeroMesa}`,
      p.color === 'blanco' ? 'Blancas' : 'Negras',
      p.rival,
      p.ratingRival || 'S/R',
      this.getResultadoTexto(p),
      p.puntosObtenidos,
      p.puntosAcumulados
    ]);

    autoTable(doc, {
      startY: 58,
      head: [['Ronda', 'Mesa', 'Color', 'Rival', 'Rating', 'Resultado', 'Pts', 'Acum.']],
      body: data,
      theme: 'striped',
      styles: {
        fontSize: 9,
        textColor: [17, 34, 57]
      },
      headStyles: {
        fillColor: [133, 77, 46],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246]
      }
    });

    doc.save(`historial_${nombreCompleto.replace(/\s+/g, '_')}.pdf`);
    this.toast.success('PDF generado','Archivo PDF de respaldo creado');
  }

  volver(): void {
    this.router.navigate(['/main-view/resultado-todos-torneos']);
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
}