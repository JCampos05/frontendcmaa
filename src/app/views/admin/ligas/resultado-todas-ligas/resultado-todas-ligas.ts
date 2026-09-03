import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { InfoLigaService } from '../../../../services/info-liga';
import { GrupoLigaService } from '../../../../services/grupo-liga';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';

import { InfoLiga } from '../../../../models/infoLiga';
import { GrupoLiga } from '../../../../models/grupoLiga';
import { JugadorLiga } from '../../../../models/jugadorLiga';

import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { SelectComponent, SelectOption } from '../../../../componentes/atoms/select/select';
import { StatCardGridComponent, StatCardInput } from '../../../../componentes/organisms/stat-card-grid/stat-card-grid';
import { DataTableComponent, DataTableColumn } from '../../../../componentes/organisms/data-table/data-table';

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
  selector: 'app-resultados-todas-ligas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ToastNoti,
    PageHeaderComponent, StateMessageComponent, EmptyStateComponent, ButtonComponent, IconComponent,
    SelectComponent, StatCardGridComponent, DataTableComponent
  ],
  templateUrl: './resultado-todas-ligas.html',
  styleUrls: ['./resultado-todas-ligas.css']
})
export class ResultadosTodasLigasComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  Math = Math;

  ligasDisponibles: InfoLiga[] = [];
  ligaSeleccionada: InfoLiga | null = null;

  grupos: GrupoLiga[] = [];
  grupoSeleccionado: GrupoLiga | null = null;

  tabla: JugadorLiga[] = [];
  estadisticasGenerales: EstadisticasGenerales | null = null;

  ordenActual: 'posicion' | 'nombre' = 'posicion';

  paginaActual: number = 1;
  itemsPorPagina: number = 15;
  totalPaginas: number = 1;

  cargando = false;
  error: string | null = null;
  sinDatos: string | null = null;

  constructor(
    private infoLigaService: InfoLigaService,
    private grupoLigaService: GrupoLigaService
  ) { }

  ngOnInit(): void {
    this.cargarLigas();
  }

  cargarLigas(): void {
    this.cargando = true;
    this.error = null;
    this.sinDatos = null;

    this.infoLigaService.getAll().subscribe({
      next: (ligas) => {
        this.ligasDisponibles = (ligas || []).sort((a, b) => {
          return new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
        });

        if (this.ligasDisponibles.length > 0) {
          this.ligaSeleccionada = this.ligasDisponibles[0];
          this.actualizarDerivados();

          if (this.ligaSeleccionada?.idLiga) {
            this.cargarGrupos(this.ligaSeleccionada.idLiga);
          }
        } else {
          this.sinDatos = 'No hay ligas registradas';
          this.actualizarDerivados();
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar las ligas';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  cargarGrupos(idLiga: number): void {
    this.grupoLigaService.getByLiga(idLiga).subscribe({
      next: (grupos) => {
        this.grupos = (grupos || []).filter(g => g.activo);
        this.actualizarDerivados();

        if (this.grupos.length > 0) {
          this.grupoSeleccionado = this.grupos[0];
          this.actualizarDerivados();
          this.cargarTabla();
        } else {
          this.tabla = [];
          this.estadisticasGenerales = null;
          this.actualizarDerivados();
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar los grupos de la liga';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  onLigaChange(): void {
    this.grupoSeleccionado = null;
    this.grupos = [];
    this.tabla = [];
    this.estadisticasGenerales = null;
    this.paginaActual = 1;
    this.actualizarDerivados();

    if (this.ligaSeleccionada?.idLiga) {
      this.cargarGrupos(this.ligaSeleccionada.idLiga);
    }
  }

  onGrupoChange(): void {
    this.paginaActual = 1;
    this.cargarTabla();
  }

  cargarTabla(): void {
    if (!this.grupoSeleccionado?.idGrupoLiga) {
      return;
    }

    this.cargando = true;
    this.error = null;
    this.sinDatos = null;

    this.grupoLigaService.getTabla(this.grupoSeleccionado.idGrupoLiga).subscribe({
      next: (response) => {
        const tablaData = response || [];

        this.tabla = (Array.isArray(tablaData) ? tablaData : []).map(jl => ({
          ...jl,
          puntos: Number(jl.puntos) || 0,
          partidas_jugadas: Number(jl.partidas_jugadas) || 0,
          victorias: Number(jl.victorias) || 0,
          empates: Number(jl.empates) || 0,
          derrotas: Number(jl.derrotas) || 0
        }));

        this.calcularPaginacion();
        this.calcularEstadisticasGenerales();
        this.actualizarDerivados();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar la tabla de posiciones:', err);
        this.tabla = [];
        this.estadisticasGenerales = null;
        this.actualizarDerivados();
        this.cargando = false;
        this.error = 'Error al cargar la tabla de posiciones';
      }
    });
  }

  calcularPaginacion(): void {
    const tablaOrdenada = this.getTablaOrdenada();
    this.totalPaginas = Math.max(1, Math.ceil(tablaOrdenada.length / this.itemsPorPagina));

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }
  }

  getTablaPaginada(): JugadorLiga[] {
    const tablaOrdenada = this.getTablaOrdenada();
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return tablaOrdenada.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarDerivados();
    }
  }

  calcularEstadisticasGenerales(): void {
    if (this.tabla.length === 0) {
      this.estadisticasGenerales = null;
      return;
    }

    const totalParticipantes = this.tabla.length;
    const partidasJugadas = Math.floor(this.tabla.reduce((sum, jl) => sum + (jl.partidas_jugadas || 0), 0) / 2);

    const liderJl = this.tabla.reduce((prev, current) => {
      return (Number(current.puntos) > Number(prev.puntos)) ? current : prev;
    });

    const ratings = this.tabla
      .map(jl => jl.jugador?.rating || jl.rating_inicial || 0)
      .filter(r => r > 0);

    const ratingPromedio = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    this.estadisticasGenerales = {
      totalParticipantes,
      partidasJugadas,
      lider: {
        nombre: `${liderJl.jugador?.nombre} ${liderJl.jugador?.apellido1}`,
        puntos: Number(liderJl.puntos)
      },
      ratingPromedio
    };
  }

  getTablaOrdenada(): JugadorLiga[] {
    const tablaCopia = [...this.tabla];

    if (this.ordenActual === 'posicion') {
      return tablaCopia.sort((a, b) => {
        if (Number(a.puntos) !== Number(b.puntos)) {
          return Number(b.puntos) - Number(a.puntos);
        }
        const victoriasA = a.victorias || 0;
        const victoriasB = b.victorias || 0;
        if (victoriasA !== victoriasB) {
          return victoriasB - victoriasA;
        }
        const ratingA = a.jugador?.rating || 0;
        const ratingB = b.jugador?.rating || 0;
        return ratingB - ratingA;
      });
    } else {
      return tablaCopia.sort((a, b) => {
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
    const doc = new jsPDF({ orientation: 'portrait' });

    try {
      const logoBase64 = await this.cargarImagenComoBase64('/LogoComite.jpg');
      const logoMarcaAgua = await this.aplicarOpacidad(logoBase64, 0.08);

      doc.addImage(logoBase64, 'JPEG', 14, 10, 25, 25);

      doc.setFontSize(18);
      doc.setTextColor(99, 48, 23);
      doc.text(`Resultados - ${this.ligaSeleccionada?.nombre}`, 45, 20);

      doc.setFontSize(12);
      doc.setTextColor(133, 77, 46);
      doc.text(`Grupo: ${this.grupoSeleccionado?.nombre || 'Sin grupo'}`, 45, 28);

      const headers = ['Pos', 'Jugador', 'Rating', 'Pts', 'PJ', 'V', 'E', 'D'];
      const data = this.getTablaOrdenada().map((jl, index) => [
        index + 1,
        `${jl.jugador?.nombre} ${jl.jugador?.apellido1} ${jl.jugador?.apellido2 || ''}`,
        jl.jugador?.rating || 'S/R',
        jl.puntos || 0,
        jl.partidas_jugadas || 0,
        jl.victorias || 0,
        jl.empates || 0,
        jl.derrotas || 0
      ]);

      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: data,
        theme: 'striped',
        styles: { fontSize: 10, textColor: [17, 34, 57], cellPadding: 3 },
        headStyles: { fillColor: [133, 77, 46], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
        alternateRowStyles: { fillColor: [243, 244, 246] },
        didDrawPage: (hookData) => {
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const logoSize = 120;
          const xCenter = (pageWidth - logoSize) / 2;
          const yCenter = (pageHeight - logoSize) / 2 + 10;

          doc.addImage(logoMarcaAgua, 'PNG', xCenter, yCenter, logoSize, logoSize);
        }
      });

      const nombreGrupo = this.grupoSeleccionado?.nombre || 'sin_grupo';
      doc.save(`resultados_liga_${nombreGrupo.replace(/ /g, '_')}.pdf`);
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

      img.onerror = () => {
        reject(new Error(`Error al cargar la imagen desde ${url}`));
      };

      img.src = url + '?t=' + new Date().getTime();
    });
  }

  private generarPDFSinLogo(): void {
    const doc = new jsPDF({ orientation: 'portrait' });

    doc.setFontSize(18);
    doc.setTextColor(99, 48, 23);
    doc.text(`Resultados - ${this.ligaSeleccionada?.nombre}`, 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(133, 77, 46);
    doc.text(`Grupo: ${this.grupoSeleccionado?.nombre || 'Sin grupo'}`, 14, 30);

    const headers = ['Pos', 'Jugador', 'Rating', 'Pts', 'PJ', 'V', 'E', 'D'];
    const data = this.getTablaOrdenada().map((jl, index) => [
      index + 1,
      `${jl.jugador?.nombre} ${jl.jugador?.apellido1} ${jl.jugador?.apellido2 || ''}`,
      jl.jugador?.rating || 'S/R',
      jl.puntos || 0,
      jl.partidas_jugadas || 0,
      jl.victorias || 0,
      jl.empates || 0,
      jl.derrotas || 0
    ]);

    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: data,
      theme: 'striped',
      styles: { fontSize: 10, textColor: [17, 34, 57], cellPadding: 3 },
      headStyles: { fillColor: [133, 77, 46], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      alternateRowStyles: { fillColor: [243, 244, 246] }
    });

    const nombreGrupo = this.grupoSeleccionado?.nombre || 'sin_grupo';
    doc.save(`resultados_liga_${nombreGrupo.replace(/ /g, '_')}.pdf`);
    this.toast.success('PDF generado', 'PDF de respaldo creado exitosamente');
  }

  exportarExcel(): void {
    const data = this.getTablaOrdenada().map((jl, index) => ({
      'Posición': index + 1,
      'Nombre': jl.jugador?.nombre,
      'Apellido 1': jl.jugador?.apellido1,
      'Apellido 2': jl.jugador?.apellido2 || '',
      'Rating': jl.jugador?.rating || 'S/R',
      'Puntos': jl.puntos,
      'Partidas Jugadas': jl.partidas_jugadas,
      'Victorias': jl.victorias,
      'Empates': jl.empates,
      'Derrotas': jl.derrotas
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

    const nombreGrupo = this.grupoSeleccionado?.nombre || 'sin_grupo';
    XLSX.writeFile(wb, `resultados_liga_${nombreGrupo.replace(/ /g, '_')}.xlsx`);
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

  // ============================================
  // HELPERS DE PRESENTACIÓN (para app-select / app-data-table / app-stat-card-grid)
  // Precomputados a campos planos (no getters) para evitar NG0103: ver
  // memoria "refactor_atomic_design" / patrón usado en resultados-torneo.
  // ============================================

  ligaOptions: SelectOption<InfoLiga>[] = [];
  grupoOptions: SelectOption<GrupoLiga>[] = [];
  statCardsGenerales: StatCardInput[] = [];
  columnasTabla: DataTableColumn[] = [];
  paginasArray: number[] = [];
  filasTabla: (JugadorLiga & { posicionMostrada: number })[] = [];

  onLigaSelectChange(liga: InfoLiga | null): void {
    this.ligaSeleccionada = liga;
    this.onLigaChange();
  }

  onGrupoSelectChange(grupo: GrupoLiga | null): void {
    this.grupoSeleccionado = grupo;
    this.onGrupoChange();
  }

  private actualizarDerivados(): void {
    this.ligaOptions = this.ligasDisponibles.map(l => ({
      value: l,
      label: `${l.nombre} - ${this.formatearFecha(l.fecha_inicio)}`
    }));

    this.grupoOptions = this.grupos.map(g => ({
      value: g,
      label: `${g.nombre} (${g.rondas || 5} rondas)`
    }));

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

    this.columnasTabla = [
      { key: 'posicion', label: 'Pos', icon: 'hash' },
      { key: 'jugador', label: 'Jugador', icon: 'user' },
      { key: 'rating', label: 'Rating', icon: 'star', align: 'center' },
      { key: 'puntos', label: 'Puntos', icon: 'trophy', align: 'center' },
      { key: 'partidas', label: 'PJ', icon: 'grid-four', align: 'center' },
      { key: 'victorias', label: 'V', icon: 'check-circle', align: 'center' },
      { key: 'empates', label: 'E', icon: 'stack', align: 'center' },
      { key: 'derrotas', label: 'D', icon: 'x-circle', align: 'center' }
    ];

    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);

    this.filasTabla = this.getTablaPaginada().map((jl, idx) => ({
      ...jl,
      posicionMostrada: (this.paginaActual - 1) * this.itemsPorPagina + idx + 1
    }));
  }
}
