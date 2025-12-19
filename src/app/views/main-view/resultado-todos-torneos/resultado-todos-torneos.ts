import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { TorneoService } from '../../../services/torneo/torneo';
import { RondaService } from '../../../services/ronda/ronda';
import { EstadisticaTorneoService } from '../../../services/estadistica-torneo/estadistica-torneo';

import { Torneo } from '../../../models/torneo';
import { TorneoCategoria } from '../../../models/torneo-categoria';
import { Ronda } from '../../../models/ronda';
import { EstadisticaTorneo, EstadisticaConCambio } from '../../../models/estadistica-torneo';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

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
  imports: [CommonModule, FormsModule, ToastNoti],
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

  ordenActual: 'posicion' | 'nombre' = 'posicion';

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 15;
  totalPaginas: number = 1;

  cargando = false;
  error: string | null = null;

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

    if (this.torneoSeleccionado?.idTorneo) {
      this.cargarCategorias(this.torneoSeleccionado.idTorneo);
    }
  }

  cargarCategorias(idTorneo: number): void {
    this.torneoService.getCategoriasByTorneo(idTorneo).subscribe({
      next: (response) => {
        this.categorias = response.categorias || [];
        console.log('Categorías cargadas:', this.categorias);
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

    if (this.categoriaSeleccionada && this.torneoSeleccionado?.idTorneo) {
      this.cargarRondas(this.torneoSeleccionado.idTorneo, this.categoriaSeleccionada);
      this.cargarEstadisticas();
    }
  }

  cargarRondas(idTorneo: number, idTorneoCat: number): void {
    console.log('=== CARGANDO RONDAS ===');
    console.log('idTorneo:', idTorneo);
    console.log('idTorneoCat seleccionado:', idTorneoCat);

    this.rondaService.getRondasByTorneo(idTorneo).subscribe({
      next: (response) => {
        const rondasArray = Array.isArray(response) ? response : [];
        this.rondasDisponibles = rondasArray.sort((a, b) => a.numeroRonda - b.numeroRonda);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar rondas:', err);
        this.rondasDisponibles = [];
        this.cdr.detectChanges();
      }
    });
  }

  onRondaChange(): void {
    this.paginaActual = 1;
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    if (!this.torneoSeleccionado?.idTorneo || !this.categoriaSeleccionada) {
      console.warn('Faltan datos para cargar estadísticas');
      return;
    }

    this.cargando = true;
    this.error = null;

    if (this.rondaSeleccionada === 0) {
      this.cargarListaInicial();
      return;
    }

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
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
        this.estadisticas = [];
        this.estadisticasGenerales = null;
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
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar lista inicial:', err);
        this.estadisticas = [];
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
    }
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
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
  }

  async exportarPDF(): Promise<void> {
    const doc = new jsPDF();

    try {
      const logoBase64 = await this.cargarImagenComoBase64('/LogoComite.jpg');
      
      // Crear versión con opacidad moderada para marca de agua
      const logoMarcaAgua = await this.aplicarOpacidad(logoBase64, 0.08);

      // NO agregar marca de agua aquí - se agregará con didDrawPage
      
      // Agregar logo en el encabezado (lado izquierdo) - sin opacidad
      doc.addImage(logoBase64, 'JPEG', 14, 10, 25, 25);

      // Título y subtítulo con colores café
      doc.setFontSize(18);
      doc.setTextColor(99, 48, 23);
      doc.text(`Resultados - ${this.torneoSeleccionado?.nombre}`, 45, 20);

      doc.setFontSize(12);
      doc.setTextColor(133, 77, 46);
      
      const categoria = this.categorias.find(c => c.idTorneoCat === Number(this.categoriaSeleccionada));
      const nomCat = categoria?.categoria?.nombre || 'Sin categoría';
      const textoRonda = this.rondaSeleccionada === 0 ? 'Lista Inicial' : `Ronda ${this.rondaSeleccionada}`;
      doc.text(`Categoría: ${nomCat} - ${textoRonda}`, 45, 28);

      // Preparar datos para la tabla
      const data = this.getEstadisticasOrdenadas().map((est, index) => [
        est.posicion_actual || index + 1,
        `${est.jugador?.nombre} ${est.jugador?.apellido1} ${est.jugador?.apellido2 || ''}`,
        est.jugador?.rating || 'S/R',
        est.puntos,
        est.partidas_jugadas,
        est.victorias,
        est.empates,
        est.derrotas
      ]);

      // Generar tabla con colores café
      autoTable(doc, {
        startY: 40,
        head: [['Pos', 'Jugador', 'Rating', 'Pts', 'PJ', 'V', 'E', 'D']],
        body: data,
        theme: 'striped',
        styles: { 
          fontSize: 10,
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
      const nombreCategoria = categoria?.categoria?.nombre || 'sin_categoria';
      doc.save(`resultados_${nombreCategoria}_ronda${this.rondaSeleccionada}.pdf`);
      this.toast.success('PDF generado','Archivo PDF creado exitosamente');
    } catch (error) {
      //console.error('Error al generar PDF:', error);
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
          // Limpiar canvas para mantener transparencia
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
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(99, 48, 23);
    doc.text(`Resultados - ${this.torneoSeleccionado?.nombre}`, 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(133, 77, 46);

    const categoria = this.categorias.find(c => c.idTorneoCat === Number(this.categoriaSeleccionada));
    const nomCat = categoria?.categoria?.nombre || 'Sin categoría';
    const textoRonda = this.rondaSeleccionada === 0 ? 'Lista Inicial' : `Ronda ${this.rondaSeleccionada}`;
    doc.text(`Categoría: ${nomCat} - ${textoRonda}`, 14, 30);

    const data = this.getEstadisticasOrdenadas().map((est, index) => [
      est.posicion_actual || index + 1,
      `${est.jugador?.nombre} ${est.jugador?.apellido1} ${est.jugador?.apellido2 || ''}`,
      est.jugador?.rating || 'S/R',
      est.puntos,
      est.partidas_jugadas,
      est.victorias,
      est.empates,
      est.derrotas
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Pos', 'Jugador', 'Rating', 'Pts', 'PJ', 'V', 'E', 'D']],
      body: data,
      theme: 'striped',
      styles: { 
        fontSize: 10,
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

    const nombreCategoria = categoria?.categoria?.nombre || 'sin_categoria';
    doc.save(`resultados_${nombreCategoria}_ronda${this.rondaSeleccionada}.pdf`);
    this.toast.success('PDF generado','PDF de respaldo creado exitosamente');
  }

  exportarExcel(): void {
    const categoria = this.categorias.find(c => c.idTorneoCat === Number(this.categoriaSeleccionada));

    const data = this.getEstadisticasOrdenadas().map((est, index) => ({
      'Posición': est.posicion_actual || index + 1,
      'Nombre': est.jugador?.nombre,
      'Apellido 1': est.jugador?.apellido1,
      'Apellido 2': est.jugador?.apellido2 || '',
      'Rating': est.jugador?.rating || 'S/R',
      'Puntos': est.puntos,
      'Partidas Jugadas': est.partidas_jugadas,
      'Victorias': est.victorias,
      'Empates': est.empates,
      'Derrotas': est.derrotas
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

    XLSX.writeFile(wb, `resultados_${categoria?.categoria?.nombre}_ronda${this.rondaSeleccionada}.xlsx`);
    this.toast.success('Excel generado','Archivo Excel creado exitosamente');
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

  irASeleccionHistorial(): void {
    this.router.navigate(['/main-view/historial-jugador-torneo']);
  }
}