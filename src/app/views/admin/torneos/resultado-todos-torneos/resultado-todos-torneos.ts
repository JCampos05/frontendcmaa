import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { TorneoService } from '../../../../services/torneo';
import { RondaService } from '../../../../services/ronda';
import { EstadisticaTorneoService } from '../../../../services/estadistica-torneo';

import { Torneo } from '../../../../models/torneo';
import { TorneoCategoria } from '../../../../models/torneo-categoria';
import { Ronda } from '../../../../models/ronda';
import { EstadisticaTorneo, EstadisticaConCambio } from '../../../../models/estadistica-torneo';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';
import { CargarRankingExcelComponent } from '../../../../componentes/principales/cargar-ranking-excel/cargar-ranking-excel';
import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { SelectComponent, SelectOption } from '../../../../componentes/atoms/select/select';
import { StatCardGridComponent, StatCardInput } from '../../../../componentes/organisms/stat-card-grid/stat-card-grid';
import { DataTableComponent, DataTableColumn } from '../../../../componentes/organisms/data-table/data-table';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';

interface EstadisticasGenerales {
  totalParticipantes: number;
  partidasJugadas: number;
  lider: {
    nombre: string;
    puntos: number;
  } | null;
  ratingPromedio: number;
}

@Component({
  selector: 'app-resultados-todo-torneos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ToastNoti, CargarRankingExcelComponent,
    PageHeaderComponent, StateMessageComponent, ButtonComponent, IconComponent,
    SelectComponent, StatCardGridComponent, DataTableComponent, EmptyStateComponent
  ],
  templateUrl: './resultado-todos-torneos.html',
  styleUrls: ['./resultado-todos-torneos.css']
})
export class ResultadosTodoTorneosComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  Math = Math;
  Array = Array;

  torneosDisponibles: Torneo[] = [];
  torneoSeleccionado: Torneo | null = null;
  categorias: TorneoCategoria[] = [];
  categoriaSeleccionada: number | null = null;

  rondasDisponibles: Ronda[] = [];
  rondaSeleccionada: number = 0;

  estadisticas: EstadisticaConCambio[] = [];
  estadisticasGenerales: EstadisticasGenerales | null = null;
  rankingFinalCargado = false;

  ordenActual: 'posicion' | 'nombre' = 'posicion';

  paginaActual: number = 1;
  itemsPorPagina: number = 15;
  totalPaginas: number = 1;

  cargando = false;
  error: string | null = null;
  sinDatos: string | null = null;

  mostrarCargarRanking = false;

  constructor(
    private torneoService: TorneoService,
    private rondaService: RondaService,
    private estadisticaService: EstadisticaTorneoService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTorneos();
  }

  cargarTorneos(): void {
    this.cargando = true;
    this.error = null;

    this.torneoService.getAll().subscribe({
      next: (torneos) => {
        this.torneosDisponibles = torneos.sort((a, b) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
        this.actualizarDerivados();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los torneos';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  onTorneoChange(): void {
    this.categorias = [];
    this.categoriaSeleccionada = null;
    this.rondaSeleccionada = 0;
    this.estadisticas = [];
    this.rondasDisponibles = [];
    this.paginaActual = 1;
    this.actualizarDerivados();

    if (this.torneoSeleccionado?.idTorneo) {
      this.cargarCategorias(this.torneoSeleccionado.idTorneo);
    }
  }

  cargarCategorias(idTorneo: number): void {
    this.torneoService.getCategoriasByTorneo(idTorneo).subscribe({
      next: (response) => {
        this.categorias = response.categorias || [];
        console.log('Categorías cargadas:', this.categorias);

        // Verificar si desempates viene en la respuesta
        this.categorias.forEach(cat => {
          console.log(`Categoría ${cat.idTorneoCat}:`, cat);
          console.log(`  - desempates:`, cat.desempates);
        });
        this.actualizarDerivados();
      },
      error: (err) => {
        this.error = 'Error al cargar categorías';
        console.error('Error:', err);
      }
    });
  }

  onCategoriaChange(): void {
    this.rondaSeleccionada = 0;
    this.estadisticas = [];
    this.rondasDisponibles = [];
    this.paginaActual = 1;
    this.rankingFinalCargado = false;
    this.actualizarDerivados();

    if (this.categoriaSeleccionada && this.torneoSeleccionado?.idTorneo) {
      this.cargarRondas(this.torneoSeleccionado.idTorneo, this.categoriaSeleccionada);
      this.cargarEstadisticas();
    }
  }

  cargarRondas(idTorneo: number, idTorneoCat: number): void {
    this.rondaService.getRondasByTorneoCategoria(idTorneo, idTorneoCat).subscribe({
      next: (response) => {
        const rondasArray = Array.isArray(response) ? response : [];
        this.rondasDisponibles = rondasArray.sort((a, b) => a.numeroRonda - b.numeroRonda);

        const todasFinalizadas = this.rondasDisponibles.every(r => r.estado === 'finalizada');
        if (todasFinalizadas && this.rondasDisponibles.length > 0) {
          this.verificarSiExisteRankingFinal(idTorneo, idTorneoCat);
        }

        this.actualizarDerivados();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar rondas:', err);
        this.rondasDisponibles = [];
        this.rankingFinalCargado = false;
        this.actualizarDerivados();
        this.cdr.detectChanges();
      }
    });
  }

  private verificarSiExisteRankingFinal(idTorneo: number, idTorneoCat: number): void {
    this.estadisticaService.getEstadisticasByTorneoCategoria(idTorneo, idTorneoCat)
      .subscribe({
        next: (estadisticas) => {
          this.rankingFinalCargado = estadisticas.some(
            est => est.posicion_actual !== null && est.posicion_actual !== undefined
          );
          this.actualizarDerivados();
          this.cdr.detectChanges();
        },
        error: () => {
          this.rankingFinalCargado = false;
          this.actualizarDerivados();
        }
      });
  }

  onRondaChange(): void {
    this.paginaActual = 1;
    this.cargarEstadisticas();
  }


  cargarEstadisticas(): void {
    if (!this.torneoSeleccionado?.idTorneo || !this.categoriaSeleccionada) {
      return;
    }

    this.cargando = true;
    this.error = null;
    this.sinDatos = null;

    console.log('=== cargarEstadisticas() ===');
    console.log('rondaSeleccionada:', this.rondaSeleccionada);
    console.log('tipo de rondaSeleccionada:', typeof this.rondaSeleccionada);
    console.log(this.rondaSeleccionada);
    //this.cargarListaFinal();

    // CRÍTICO: Comparación estricta con número -1
    if (this.rondaSeleccionada === -1) {
      console.log('✓ Detectado Lista Final, llamando a cargarListaFinal()');
      this.cargarListaFinal();
      return;
    }

    if (this.rondaSeleccionada === 0) {
      console.log('✓ Detectado Lista Inicial, llamando a cargarListaInicial()');
      this.cargarListaInicial();
      return;
    }

    // Rondas normales (1, 2, 3, 4, 5...)
    console.log('✓ Ronda normal, llamando a getEstadisticasByTorneoCategoriaHastaRonda()');

    this.estadisticaService.getEstadisticasByTorneoCategoriaHastaRonda(
      this.torneoSeleccionado.idTorneo,
      this.categoriaSeleccionada,
      this.rondaSeleccionada
    ).subscribe({
      next: (response) => {
        const estadisticasData = response || [];

        this.estadisticas = (Array.isArray(estadisticasData) ? estadisticasData : []).map(est => ({
          ...est,
          puntos: Number(est.puntos) || 0,
          partidas_jugadas: Number(est.partidas_jugadas) || 0,
          victorias: Number(est.victorias) || 0,
          empates: Number(est.empates) || 0,
          derrotas: Number(est.derrotas) || 0,
          posicion_actual: est.posicion_actual || null,
          cambioPosicion: 0
        }));

        this.calcularPaginacion();
        this.calcularEstadisticasGenerales();
        this.actualizarDerivados();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
        this.estadisticas = [];
        this.estadisticasGenerales = null;
        this.actualizarDerivados();
        this.cargando = false;

        if (err.status === 404) {
          this.error = null;
        } else {
          this.error = 'Error al cargar las estadísticas';
        }
      }
    });
  }

  private cargarListaInicial(): void {
    this.estadisticaService.getEstadisticasByTorneoCategoria(
      this.torneoSeleccionado!.idTorneo!,
      this.categoriaSeleccionada!
    ).subscribe({
      next: (response) => {
        const estadisticasData = response || [];

        this.estadisticas = (Array.isArray(estadisticasData) ? estadisticasData : []).map(est => ({
          ...est,
          puntos: 0,
          partidas_jugadas: 0,
          victorias: 0,
          empates: 0,
          derrotas: 0,
          posicion_actual: null,
          cambioPosicion: 0
        }));

        this.estadisticas.sort((a, b) => {
          const ratingA = a.jugador?.rating || 0;
          const ratingB = b.jugador?.rating || 0;
          return ratingB - ratingA;
        });

        this.calcularPaginacion();
        this.calcularEstadisticasGenerales();
        this.actualizarDerivados();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar lista inicial:', err);
        this.estadisticas = [];
        this.actualizarDerivados();
        this.cargando = false;
      }
    });
  }

  calcularPaginacion(): void {
    const estadisticasOrdenadas = this.getEstadisticasOrdenadas();
    this.totalPaginas = Math.ceil(estadisticasOrdenadas.length / this.itemsPorPagina);

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }
  }

  getEstadisticasPaginadas(): EstadisticaConCambio[] {
    const estadisticasOrdenadas = this.getEstadisticasOrdenadas();
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return estadisticasOrdenadas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarDerivados();
    }
  }

  calcularEstadisticasGenerales(): void {
    if (this.estadisticas.length === 0) {
      this.estadisticasGenerales = null;
      return;
    }

    const totalParticipantes = this.estadisticas.length;
    const partidasJugadas = this.estadisticas.reduce((sum, est) => sum + (est.partidas_jugadas || 0), 0);

    const liderEst = this.estadisticas.reduce((prev, current) => {
      return (current.puntos > prev.puntos) ? current : prev;
    });

    const ratings = this.estadisticas
      .map(est => est.jugador?.rating || 0)
      .filter(r => r > 0);

    const ratingPromedio = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    this.estadisticasGenerales = {
      totalParticipantes,
      partidasJugadas,
      lider: {
        nombre: `${liderEst.jugador?.nombre} ${liderEst.jugador?.apellido1}`,
        puntos: liderEst.puntos
      },
      ratingPromedio
    };
  }

  getEstadisticasOrdenadas(): EstadisticaConCambio[] {
    const estadisticasCopia = [...this.estadisticas];

    if (this.ordenActual === 'posicion') {
      return estadisticasCopia.sort((a, b) => {
        if (a.puntos !== b.puntos) {
          return b.puntos - a.puntos;
        }
        const ratingA = a.jugador?.rating || 0;
        const ratingB = b.jugador?.rating || 0;
        return ratingB - ratingA;
      });
    } else {
      return estadisticasCopia.sort((a, b) => {
        const nombreA = `${a.jugador?.nombre} ${a.jugador?.apellido1}`.toLowerCase();
        const nombreB = `${b.jugador?.nombre} ${b.jugador?.apellido1}`.toLowerCase();
        return nombreA.localeCompare(nombreB);
      });
    }
  }

  toggleOrden(): void {
    this.ordenActual = this.ordenActual === 'posicion' ? 'nombre' : 'posicion';
    this.actualizarDerivados();
  }

  async exportarPDF(): Promise<void> {
    // Determinar orientación según si es Lista Final
    const esListaFinal = this.rondaSeleccionada === -1;
    const orientacion = esListaFinal ? 'landscape' : 'portrait';

    const doc = new jsPDF({
      orientation: orientacion as 'portrait' | 'landscape'
    });

    try {
      const logoBase64 = await this.cargarImagenComoBase64('/LogoComite.jpg');
      const logoMarcaAgua = await this.aplicarOpacidad(logoBase64, 0.08);

      doc.addImage(logoBase64, 'JPEG', 14, 10, 25, 25);

      doc.setFontSize(18);
      doc.setTextColor(99, 48, 23);
      doc.text(`Resultados - ${this.torneoSeleccionado?.nombre}`, 45, 20);

      doc.setFontSize(12);
      doc.setTextColor(133, 77, 46);

      const categoria = this.categorias.find(c => c.idTorneoCat === Number(this.categoriaSeleccionada));
      const nomCat = categoria?.categoria?.nombre || 'Sin categoría';
      const textoRonda = this.getBadgeTexto();
      doc.text(`Categoría: ${nomCat} - ${textoRonda}`, 45, 28);

      const sistemasDesempate = esListaFinal ? this.getSistemasDesempateActual() : [];

      // Construir headers dinámicamente
      const headers = ['Pos', 'Jugador', 'Rating', 'Pts'];
      if (esListaFinal) {
        sistemasDesempate.forEach((sistema, idx) => {
          headers.push(`${idx + 1}. ${sistema}`);
        });
      } else {
        headers.push('PJ', 'V', 'E', 'D');
      }

      // Construir data dinámicamente
      const data = this.getEstadisticasOrdenadas().map((est, index) => {
        const baseData = [
          est.posicion_actual || index + 1,
          `${est.jugador?.nombre} ${est.jugador?.apellido1} ${est.jugador?.apellido2 || ''}`,
          est.jugador?.rating || 'S/R',
          est.puntos
        ];

        if (esListaFinal) {
          sistemasDesempate.forEach(sistema => {
            baseData.push(this.getValorDesempate(est, sistema));
          });
        } else {
          baseData.push(
            est.partidas_jugadas,
            est.victorias,
            est.empates,
            est.derrotas
          );
        }

        return baseData;
      });

      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: data,
        theme: 'striped',
        styles: {
          fontSize: esListaFinal ? 8 : 10,
          textColor: [17, 34, 57],
          cellPadding: esListaFinal ? 2 : 3
        },
        headStyles: {
          fillColor: [133, 77, 46],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: esListaFinal ? 8 : 10
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246]
        },
        columnStyles: esListaFinal ? {
          0: { cellWidth: 15 },  // Pos
          1: { cellWidth: 50 },  // Jugador
          2: { cellWidth: 20 },  // Rating
          3: { cellWidth: 15 }   // Puntos
          // Las columnas de desempate se ajustan automáticamente
        } : undefined,
        didDrawPage: (hookData) => {
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const logoSize = 120;
          const xCenter = (pageWidth - logoSize) / 2;
          const yCenter = (pageHeight - logoSize) / 2 + 10;

          doc.addImage(logoMarcaAgua, 'PNG', xCenter, yCenter, logoSize, logoSize);
        }
      });

      const nombreCategoria = categoria?.categoria?.nombre || 'sin_categoria';
      doc.save(`resultados_${nombreCategoria}_${textoRonda.replace(/ /g, '_')}.pdf`);
      this.toast.success('PDF generado', 'Archivo PDF creado exitosamente');
    } catch (error) {
      this.toast.warning('Error al generar archivo PDF; creando PDF de respaldo');
      this.generarPDFSinLogo();
    }
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

      img.onerror = (error) => {
        reject(new Error(`Error al cargar la imagen desde ${url}`));
      };

      img.src = url + '?t=' + new Date().getTime();
    });
  }

  private generarPDFSinLogo(): void {
    const esListaFinal = this.rondaSeleccionada === -1;
    const orientacion = esListaFinal ? 'landscape' : 'portrait';

    const doc = new jsPDF({
      orientation: orientacion as 'portrait' | 'landscape'
    });

    doc.setFontSize(18);
    doc.setTextColor(99, 48, 23);
    doc.text(`Resultados - ${this.torneoSeleccionado?.nombre}`, 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(133, 77, 46);

    const categoria = this.categorias.find(c => c.idTorneoCat === Number(this.categoriaSeleccionada));
    const nomCat = categoria?.categoria?.nombre || 'Sin categoría';
    const textoRonda = this.getBadgeTexto();
    doc.text(`Categoría: ${nomCat} - ${textoRonda}`, 14, 30);

    const sistemasDesempate = esListaFinal ? this.getSistemasDesempateActual() : [];

    const headers = ['Pos', 'Jugador', 'Rating', 'Pts'];
    if (esListaFinal) {
      sistemasDesempate.forEach((sistema, idx) => {
        headers.push(`${idx + 1}. ${sistema}`);
      });
    } else {
      headers.push('PJ', 'V', 'E', 'D');
    }

    const data = this.getEstadisticasOrdenadas().map((est, index) => {
      const baseData = [
        est.posicion_actual || index + 1,
        `${est.jugador?.nombre} ${est.jugador?.apellido1} ${est.jugador?.apellido2 || ''}`,
        est.jugador?.rating || 'S/R',
        est.puntos
      ];

      if (esListaFinal) {
        sistemasDesempate.forEach(sistema => {
          baseData.push(this.getValorDesempate(est, sistema));
        });
      } else {
        baseData.push(
          est.partidas_jugadas,
          est.victorias,
          est.empates,
          est.derrotas
        );
      }

      return baseData;
    });

    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: data,
      theme: 'striped',
      styles: {
        fontSize: esListaFinal ? 8 : 10,
        textColor: [17, 34, 57],
        cellPadding: esListaFinal ? 2 : 3
      },
      headStyles: {
        fillColor: [133, 77, 46],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: esListaFinal ? 8 : 10
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246]
      },
      columnStyles: esListaFinal ? {
        0: { cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 }
      } : undefined
    });

    const nombreCategoria = categoria?.categoria?.nombre || 'sin_categoria';
    doc.save(`resultados_${nombreCategoria}_${textoRonda.replace(/ /g, '_')}.pdf`);
    this.toast.success('PDF generado', 'PDF de respaldo creado exitosamente');
  }

  exportarExcel(): void {
    const categoria = this.categorias.find(c => c.idTorneoCat === Number(this.categoriaSeleccionada));
    const esListaFinal = this.rondaSeleccionada === -1;
    const sistemasDesempate = esListaFinal ? this.getSistemasDesempateActual() : [];

    const data = this.getEstadisticasOrdenadas().map((est, index) => {
      const baseData: any = {
        'Posición': est.posicion_actual || index + 1,
        'Nombre': est.jugador?.nombre,
        'Apellido 1': est.jugador?.apellido1,
        'Apellido 2': est.jugador?.apellido2 || '',
        'Rating': est.jugador?.rating || 'S/R',
        'Puntos': est.puntos
      };

      if (esListaFinal) {
        sistemasDesempate.forEach((sistema, idx) => {
          baseData[`${idx + 1}. ${sistema}`] = this.getValorDesempate(est, sistema);
        });
      } else {
        baseData['Partidas Jugadas'] = est.partidas_jugadas;
        baseData['Victorias'] = est.victorias;
        baseData['Empates'] = est.empates;
        baseData['Derrotas'] = est.derrotas;
      }

      return baseData;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

    const textoRonda = this.getBadgeTexto();
    XLSX.writeFile(wb, `resultados_${categoria?.categoria?.nombre}_${textoRonda.replace(/ /g, '_')}.xlsx`);
    this.toast.success('Excel generado', 'Archivo Excel creado exitosamente');
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

  abrirCargarRanking(): void {
    if (!this.categoriaSeleccionada) {
      this.toast.warning('Advertencia', 'Selecciona una categoría primero');
      return;
    }
    this.mostrarCargarRanking = true;
  }

  cerrarCargarRanking(): void {
    this.mostrarCargarRanking = false;
  }

  onRankingCargadoExitoso(): void {
    this.mostrarCargarRanking = false;
    this.rankingFinalCargado = true;
    this.estadisticas = [];
    this.rondaSeleccionada = -1;
    this.cargarEstadisticas();
    this.toast.success('Éxito', 'Ranking cargado correctamente. Mostrando Lista Final.');
  }

  getTorneoCategoriaSeleccionada(): TorneoCategoria {
    return this.categorias.find(c => c.idTorneoCat === this.categoriaSeleccionada) || {} as TorneoCategoria;
  }

  getJugadoresParaRanking(): any[] {
    return this.estadisticas.map(e => ({
      idJugador: e.idJugador,
      nombre: e.jugador?.nombre || '',
      apellido1: e.jugador?.apellido1 || '',
      apellido2: e.jugador?.apellido2 || '',
      rating: e.jugador?.rating || 0
    }));
  }

  puedeCargarRankingFinal(): boolean {
    if (!this.categoriaSeleccionada || this.estadisticas.length === 0) {
      return false;
    }

    if (this.rondasDisponibles.length === 0) {
      return false;
    }

    const todasFinalizadas = this.rondasDisponibles.every(
      ronda => ronda.estado === 'finalizada'
    );

    return todasFinalizadas;
  }

  tieneRankingFinal(): boolean {
    if (!this.categoriaSeleccionada) {
      return false;
    }

    if (this.rondasDisponibles.length === 0) {
      return false;
    }

    const todasFinalizadas = this.rondasDisponibles.every(
      ronda => ronda.estado === 'finalizada'
    );

    if (!todasFinalizadas) {
      return false;
    }

    return this.rankingFinalCargado;
  }

  getBadgeTexto(): string {
    if (this.rondaSeleccionada === 0) {
      return 'Lista Inicial';
    } else if (this.rondaSeleccionada === -1) {
      return 'Lista Final';
    } else {
      return `Ronda ${this.rondaSeleccionada}`;
    }
  }

  irASeleccionHistorial(): void {
    this.router.navigate(['/main-view/historial-jugador-torneo']);
  }

  // ============================================
  // FUNCIONES PARA LISTA FINAL
  // ============================================

  private cargarListaFinal(): void {
    console.log('=== DENTRO DE cargarListaFinal() ===');
    console.log('idTorneo:', this.torneoSeleccionado!.idTorneo);
    console.log('idTorneoCategoria:', this.categoriaSeleccionada);

    this.estadisticaService.getRankingFinal(
      this.torneoSeleccionado!.idTorneo!,
      this.categoriaSeleccionada!
    ).subscribe({
      next: (response) => {
        console.log('Respuesta getRankingFinal exitosa:', response);
        const estadisticasData = response || [];

        this.estadisticas = (Array.isArray(estadisticasData) ? estadisticasData : [])
          .map(est => {
            let desempatesObj = {};

            if (est.desempates) {
              console.log('Desempates RAW para jugador', est.jugador?.nombre, ':', est.desempates);
              console.log('Tipo de desempates:', typeof est.desempates);

              if (typeof est.desempates === 'string') {
                try {
                  desempatesObj = JSON.parse(est.desempates);
                  console.log('Desempates parseados:', desempatesObj);
                } catch (e) {
                  console.warn('Error al parsear desempates:', e);
                  desempatesObj = {};
                }
              } else if (typeof est.desempates === 'object') {
                desempatesObj = est.desempates;
                console.log('Desempates ya es objeto:', desempatesObj);
              }
            }

            return {
              ...est,
              puntos: Number(est.puntos) || 0,
              partidas_jugadas: Number(est.partidas_jugadas) || 0,
              victorias: Number(est.victorias) || 0,
              empates: Number(est.empates) || 0,
              derrotas: Number(est.derrotas) || 0,
              posicion_actual: est.posicion_actual || null,
              cambioPosicion: 0,
              desempates: desempatesObj
            };
          });

        this.estadisticas.sort((a, b) => {
          if (a.posicion_actual && b.posicion_actual) {
            return a.posicion_actual - b.posicion_actual;
          }
          return b.puntos - a.puntos;
        });

        console.log('Total estadísticas procesadas:', this.estadisticas.length);
        console.log('Primera estadística completa:', this.estadisticas[0]);

        this.calcularPaginacion();
        this.calcularEstadisticasGenerales();
        this.actualizarDerivados();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar lista final:', err);
        console.error('Status code:', err.status);
        console.error('Mensaje:', err.message);
        this.estadisticas = [];
        this.actualizarDerivados();
        this.cargando = false;
        this.sinDatos = 'No se encontró ranking final';
      }
    });
  }

  getSistemasDesempateActual(): string[] {
    // IMPORTANTE: Cambiar la lógica de verificación
    if (this.rondaSeleccionada !== -1) {
      return [];
    }

    if (!this.categoriaSeleccionada) {
      return [];
    }

    const categoria = this.categorias.find(c => c.idTorneoCat === this.categoriaSeleccionada);

    if (!categoria || !categoria.desempates || !Array.isArray(categoria.desempates)) {
      console.warn('No se encontraron sistemas de desempate en la categoría');
      return [];
    }

    console.log('Sistemas de desempate configurados:', categoria.desempates);
    return categoria.desempates;
  }

  getValorDesempate(estadistica: EstadisticaConCambio, sistema: string): string | number {
    if (!estadistica.desempates || typeof estadistica.desempates !== 'object') {
      return '-';
    }

    const valor = estadistica.desempates[sistema];

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

  // ============================================
  // HELPERS DE PRESENTACIÓN (para app-select / app-data-table / app-stat-card-grid)
  // No alteran la lógica de negocio, solo adaptan los datos ya existentes.
  // ============================================

  torneoOptions: SelectOption<Torneo>[] = [];
  categoriaOptions: SelectOption<number>[] = [];
  rondaOptions: SelectOption<number>[] = [];
  statCardsGenerales: StatCardInput[] = [];
  columnasTabla: DataTableColumn[] = [];
  paginasArray: number[] = [];
  filasTabla: (EstadisticaConCambio & { posicionMostrada: number })[] = [];

  onTorneoSelectChange(torneo: Torneo | null): void {
    this.torneoSeleccionado = torneo;
    this.onTorneoChange();
  }

  onCategoriaSelectChange(idTorneoCat: number): void {
    this.categoriaSeleccionada = idTorneoCat;
    this.onCategoriaChange();
  }

  onRondaSelectChange(valor: number): void {
    this.rondaSeleccionada = valor;
    this.onRondaChange();
  }

  /**
   * Recalcula todos los campos derivados que se consumen directamente en el
   * template (options de selects, stat cards, columnas de tabla, paginación
   * y filas de la tabla). Se invoca explícitamente en cada punto donde cambian
   * sus fuentes — nunca se leen como getters desde el template.
   */
  private actualizarDerivados(): void {
    this.torneoOptions = this.torneosDisponibles.map(t => ({
      value: t,
      label: `${t.nombre} - ${this.formatearFecha(t.fecha)}`
    }));

    this.categoriaOptions = this.categorias.map(cat => ({
      value: cat.idTorneoCat!,
      label: `${cat.categoria?.nombre} (${cat.rondas} rondas)`
    }));

    const opcionesRonda: SelectOption<number>[] = [{ value: 0, label: 'Lista Inicial' }];
    this.rondasDisponibles.forEach(ronda => {
      opcionesRonda.push({
        value: ronda.numeroRonda,
        label: `Ronda ${ronda.numeroRonda}${ronda.estado === 'finalizada' ? ' - Finalizada' : ''}`
      });
    });
    if (this.tieneRankingFinal()) {
      opcionesRonda.push({ value: -1, label: 'Lista Final' });
    }
    this.rondaOptions = opcionesRonda;

    if (!this.estadisticasGenerales) {
      this.statCardsGenerales = [];
    } else {
      const e = this.estadisticasGenerales;
      this.statCardsGenerales = [
        { icon: 'users', variant: 'info', label: 'Participantes', value: e.totalParticipantes },
        { icon: 'grid-four', variant: 'success', label: 'Partidas Jugadas', value: e.partidasJugadas },
        { icon: 'trophy', variant: 'warning', label: 'Líder Actual', value: e.lider?.nombre || '-', sub: e.lider ? `${e.lider.puntos} pts` : undefined },
        { icon: 'chart-line', variant: 'purple', label: 'Rating Promedio', value: Math.round(e.ratingPromedio) }
      ];
    }

    const columnas: DataTableColumn[] = [
      { key: 'posicion', label: 'Pos', icon: 'hash' },
      { key: 'jugador', label: 'Jugador', icon: 'user' },
      { key: 'rating', label: 'Rating', icon: 'star', align: 'center' },
      { key: 'puntos', label: 'Puntos', icon: 'trophy', align: 'center' }
    ];
    if (this.rondaSeleccionada === -1) {
      this.getSistemasDesempateActual().forEach((sistema, idx) => {
        columnas.push({ key: `desempate-${idx}`, label: `${idx + 1}. ${sistema}`, icon: 'medal', align: 'center' });
      });
    } else {
      columnas.push(
        { key: 'partidas', label: 'PJ', icon: 'grid-four', align: 'center' },
        { key: 'victorias', label: 'V', icon: 'check-circle', align: 'center' },
        { key: 'empates', label: 'E', icon: 'stack', align: 'center' },
        { key: 'derrotas', label: 'D', icon: 'x-circle', align: 'center' }
      );
      if (this.rondaSeleccionada && this.rondaSeleccionada > 0) {
        columnas.push({ key: 'cambio', label: 'Cambio', icon: 'arrows-down-up', align: 'center' });
      }
    }
    this.columnasTabla = columnas;

    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);

    this.filasTabla = this.getEstadisticasPaginadas().map((est, idx) => ({
      ...est,
      posicionMostrada: est.posicion_actual || (this.paginaActual - 1) * this.itemsPorPagina + idx + 1
    }));
  }
}
