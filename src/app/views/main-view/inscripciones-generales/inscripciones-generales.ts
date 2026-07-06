import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { InscripcionesGeneralesService } from '../../../services/inscripciones-generales';
import { ExportModalComponent } from '../../../componentes/modales/export-modal/export-modal';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

Chart.register(...registerables);

@Component({
  selector: 'app-inscripciones-generales',
  standalone: true,
  imports: [CommonModule, FormsModule, ExportModalComponent, ToastNoti],
  templateUrl: './inscripciones-generales.html',
  styleUrls: ['./inscripciones-generales.css']
})
export class InscripcionesGeneralesComponent implements OnInit, AfterViewInit {
  @ViewChild(ExportModalComponent) exportModal!: ExportModalComponent;
  @ViewChild(ToastNoti) toast!: ToastNoti;

  cargando = false;
  error: string | null = null;

  // Resumen General
  resumenGeneral: any = null;
  periodoSeleccionado: 'dia' | 'semana' | 'mes' | 'anio' = 'mes';

  // Evolución Temporal
  evolucionTemporal: any[] = [];
  chartEvolucion: Chart | null = null;

  // Resumen de Torneos
  resumenTorneos: any = null;

  // Inscripciones por Torneo
  inscripcionesPorTorneo: any[] = [];
  chartPorTorneo: Chart | null = null;

  // Selector de Torneo y Categoría
  torneos: any[] = [];
  torneoSeleccionado: number | null = null;
  distribucionCategorias: any[] = [];
  chartDistribucion: Chart | null = null;

  constructor(private inscripcionesService: InscripcionesGeneralesService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    // Las gráficas se inicializan después de cargar los datos
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    Promise.all([
      this.cargarResumenGeneral(),
      this.cargarEvolucionTemporal(),
      this.cargarResumenTorneos(),
      this.cargarInscripcionesPorTorneo(),
      this.cargarTorneosSelector()
    ]).then(() => {
      this.cargando = false;
    }).catch(error => {
      console.error('Error al cargar datos:', error);
      this.error = 'Error al cargar la información';
      this.cargando = false;
    });
  }

  cargarResumenGeneral(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.inscripcionesService.getResumenGeneral(this.periodoSeleccionado).subscribe({
        next: (data) => {
          this.resumenGeneral = data;
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  cargarEvolucionTemporal(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.inscripcionesService.getEvolucionTemporal(this.periodoSeleccionado).subscribe({
        next: (data) => {
          this.evolucionTemporal = data;
          setTimeout(() => this.crearGraficaEvolucion(), 100);
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  cargarResumenTorneos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.inscripcionesService.getResumenTorneos().subscribe({
        next: (data) => {
          this.resumenTorneos = data;
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  cargarInscripcionesPorTorneo(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.inscripcionesService.getInscripcionesPorTorneo(10).subscribe({
        next: (data) => {
          this.inscripcionesPorTorneo = data;
          setTimeout(() => this.crearGraficaPorTorneo(), 100);
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  cargarTorneosSelector(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.inscripcionesService.getTorneosParaSelector().subscribe({
        next: (data) => {
          this.torneos = data;
          if (this.torneos.length > 0) {
            this.torneoSeleccionado = this.torneos[0].idTorneo;
            this.cargarDistribucionCategorias();
          }
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  cargarDistribucionCategorias(): void {
    if (!this.torneoSeleccionado) return;

    this.inscripcionesService.getDistribucionCategoria(this.torneoSeleccionado).subscribe({
      next: (data) => {
        this.distribucionCategorias = data;
        setTimeout(() => this.crearGraficaDistribucion(), 100);
      },
      error: (err) => {
        console.error('Error al cargar distribución:', err);
      }
    });
  }

  cambiarPeriodo(periodo: 'dia' | 'semana' | 'mes' | 'anio'): void {
    this.periodoSeleccionado = periodo;
    this.cargarResumenGeneral();
    this.cargarEvolucionTemporal();
  }

  onTorneoChange(): void {
    this.cargarDistribucionCategorias();
  }

  // Gráficas
  crearGraficaEvolucion(): void {
    const canvas = document.getElementById('chartEvolucion') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartEvolucion) {
      this.chartEvolucion.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chartEvolucion = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.evolucionTemporal.map(e => e.periodo),
        datasets: [{
          label: 'Inscripciones',
          data: this.evolucionTemporal.map(e => e.total),
          borderColor: '#854D2E',
          backgroundColor: 'rgba(133, 77, 46, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#854D2E',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  crearGraficaPorTorneo(): void {
    const canvas = document.getElementById('chartPorTorneo') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartPorTorneo) {
      this.chartPorTorneo.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chartPorTorneo = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.inscripcionesPorTorneo.map(t => t.torneo),
        datasets: [{
          label: 'Total de Inscritos',
          data: this.inscripcionesPorTorneo.map(t => t.total),
          backgroundColor: '#854D2E',
          borderColor: '#633017',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  crearGraficaDistribucion(): void {
    const canvas = document.getElementById('chartDistribucion') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartDistribucion) {
      this.chartDistribucion.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colores = [
      '#854D2E', '#112239', '#E4C091', '#633017', '#E54839',
      '#3E4B8B', '#10b981', '#F59E0B', '#8b5cf6', '#14b8a6'
    ];

    this.chartDistribucion = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.distribucionCategorias.map(c => c.categoria),
        datasets: [{
          data: this.distribucionCategorias.map(c => c.total),
          backgroundColor: colores.slice(0, this.distribucionCategorias.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  // Exportación
  exportarReporte(): void {
    this.exportModal.open();
  }

  onExportar(opciones: { formato: 'pdf' | 'excel'; tipoContenido: 'datos' | 'graficas' | 'completo' }): void {
    this.toast.info('Generando reporte', `Exportando ${opciones.tipoContenido} en formato ${opciones.formato.toUpperCase()}...`);

    if (opciones.formato === 'pdf') {
      this.exportarPDFMejorado(opciones.tipoContenido);
    } else {
      this.exportarExcelMejorado();
    }
  }

  private async exportarPDFMejorado(tipoContenido: 'datos' | 'graficas' | 'completo'): Promise<void> {
    Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]).then(async ([jsPDFModule, autoTableModule]) => {
      const { default: jsPDF } = jsPDFModule as any;
      const doc = new jsPDF();

      try {
        const logoBase64 = await this.cargarImagenComoBase64('/LogoComite.jpg');

        this.agregarEncabezadoPDF(doc, logoBase64);

        let yPosition = 42;

        if (tipoContenido === 'datos' || tipoContenido === 'completo') {
          yPosition = this.agregarDatosPDF(doc, autoTableModule, yPosition);
        }

        if (tipoContenido === 'graficas' || tipoContenido === 'completo') {
          if (tipoContenido === 'completo' && yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          }
          this.agregarGraficasPDF(doc, yPosition);
        }

        this.agregarPiePaginaPDF(doc);

        const tipoTexto = tipoContenido === 'datos' ? 'Datos' : tipoContenido === 'graficas' ? 'Graficas' : 'Completo';
        const filename = `Reporte_Inscripciones_${tipoTexto}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

        this.toast.success('PDF generado', `El archivo ${filename} se ha descargado correctamente`);
      } catch (error) {
        console.error('Error al cargar logo:', error);
        this.generarPDFSinLogo(tipoContenido, autoTableModule);
      }
    }).catch(error => {
      console.error('Error al exportar PDF:', error);
      this.toast.error('Error al exportar', 'No se pudo generar el PDF.');
    });
  }

  private agregarEncabezadoPDF(doc: any, logoBase64?: string): void {
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', 14, 10, 25, 25);
    }

    doc.setFontSize(20);
    doc.setTextColor(17, 34, 57);
    doc.text('Reporte General de Inscripciones', logoBase64 ? 45 : 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const periodoTexto = this.getPeriodoTexto();
    doc.text(`Período: ${periodoTexto}`, logoBase64 ? 45 : 14, 28);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, logoBase64 ? 45 : 14, 33);

    doc.setDrawColor(227, 225, 221);
    doc.line(14, 36, 196, 36);
  }

  private agregarDatosPDF(doc: any, autoTableModule: any, yPosition: number): number {
    if (this.resumenGeneral) {
      doc.setFontSize(14);
      doc.setTextColor(133, 77, 46);
      doc.text('Resumen General', 14, yPosition);
      yPosition += 8;

      const resumenData = [
        ['Total Inscripciones', this.resumenGeneral.totalInscripciones.toString()],
        ['Inscripciones Confirmadas', this.getInscripcionesConfirmadas().toString()],
        ['Inscripciones Pendientes', this.getInscripcionesPendientes().toString()],
        ['Torneos Activos', this.resumenGeneral.torneosActivos.toString()],
        ['Promedio Diario', this.resumenGeneral.promedioDiario.toString()]
      ];

      autoTableModule.default(doc, {
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: resumenData,
        theme: 'striped',
        headStyles: { fillColor: [133, 77, 46] },
        margin: { left: 14, right: 14 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    if (this.inscripcionesPorTorneo.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(133, 77, 46);
      doc.text('Top 10 Torneos con Más Inscritos', 14, yPosition);
      yPosition += 8;

      const torneoData = this.inscripcionesPorTorneo.map(t => [
        t.torneo,
        t.total.toString()
      ]);

      autoTableModule.default(doc, {
        startY: yPosition,
        head: [['Torneo', 'Total Inscritos']],
        body: torneoData,
        theme: 'striped',
        headStyles: { fillColor: [133, 77, 46] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    if (this.distribucionCategorias.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(133, 77, 46);
      const torneoNombre = this.torneos.find(t => t.idTorneo === this.torneoSeleccionado)?.nombre || 'Torneo seleccionado';
      doc.text(`Distribución por Categoría - ${torneoNombre}`, 14, yPosition);
      yPosition += 8;

      const categoriaData = this.distribucionCategorias.map(cat => [
        cat.categoria,
        cat.total.toString(),
        this.formatearMoneda(cat.costo)
      ]);

      autoTableModule.default(doc, {
        startY: yPosition,
        head: [['Categoría', 'Inscritos', 'Costo']],
        body: categoriaData,
        theme: 'striped',
        headStyles: { fillColor: [133, 77, 46] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    return yPosition;
  }

  private agregarGraficasPDF(doc: any, yPosition: number): void {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.setTextColor(133, 77, 46);
    doc.text('Gráficas y Visualizaciones', 14, yPosition);
    yPosition += 15;

    const graficas = [
      { selector: '#chartEvolucion', titulo: 'Evolución Temporal de Inscripciones', altura: 70 },
      { selector: '#chartPorTorneo', titulo: 'Top 10 Torneos con Más Inscritos', altura: 70 },
      { selector: '#chartDistribucion', titulo: 'Distribución por Categoría', altura: 70 }
    ];

    graficas.forEach((grafica) => {
      const canvas = document.querySelector(grafica.selector) as HTMLCanvasElement;
      if (canvas) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(133, 77, 46);
        doc.text(grafica.titulo, 14, yPosition);
        yPosition += 8;

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const imgHeight = grafica.altura;

        doc.addImage(imgData, 'PNG', 14, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 20;
      }
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

  private generarPDFSinLogo(tipoContenido: 'datos' | 'graficas' | 'completo', autoTableModule: any): void {
    import('jspdf').then((jsPDFModule) => {
      const { default: jsPDF } = jsPDFModule as any;
      const doc = new jsPDF();

      this.agregarEncabezadoPDF(doc);

      let yPosition = 42;

      if (tipoContenido === 'datos' || tipoContenido === 'completo') {
        yPosition = this.agregarDatosPDF(doc, autoTableModule, yPosition);
      }

      if (tipoContenido === 'graficas' || tipoContenido === 'completo') {
        if (tipoContenido === 'completo' && yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        this.agregarGraficasPDF(doc, yPosition);
      }

      this.agregarPiePaginaPDF(doc);

      const tipoTexto = tipoContenido === 'datos' ? 'Datos' : tipoContenido === 'graficas' ? 'Graficas' : 'Completo';
      const filename = `Reporte_Inscripciones_${tipoTexto}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      this.toast.success('PDF generado', `El archivo ${filename} se ha descargado correctamente`);
    });
  }

  private agregarPiePaginaPDF(doc: any): void {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, 14, 285);
      doc.text('Comité de Ajedrez - Reporte Confidencial', 105, 285, { align: 'center' });
    }
  }

  private exportarExcelMejorado(): void {
    import('exceljs').then((ExcelJSModule) => {
      const ExcelJS = ExcelJSModule.default;
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Comité de Ajedrez';
      workbook.created = new Date();

      // HOJA 1: RESUMEN GENERAL
      if (this.resumenGeneral) {
        const sheet1 = workbook.addWorksheet('Resumen General', {
          properties: { tabColor: { argb: 'FF854D2E' } }
        });

        sheet1.getColumn(1).width = 32;
        sheet1.getColumn(2).width = 20;

        sheet1.mergeCells('A1:B1');
        const tituloCell = sheet1.getCell('A1');
        tituloCell.value = 'REPORTE GENERAL DE INSCRIPCIONES';
        tituloCell.font = { bold: true, size: 16, color: { argb: 'FF854D2E' } };
        tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        tituloCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE4C091' }
        };
        sheet1.getRow(1).height = 25;

        sheet1.getCell('A3').value = 'Período:';
        sheet1.getCell('A3').font = { bold: true };
        sheet1.getCell('B3').value = this.getPeriodoTexto();

        sheet1.getCell('A4').value = 'Generado:';
        sheet1.getCell('A4').font = { bold: true };
        sheet1.getCell('B4').value = new Date().toLocaleDateString('es-MX', {
          year: 'numeric', month: 'long', day: 'numeric'
        });

        sheet1.mergeCells('A6:B6');
        const seccionCell = sheet1.getCell('A6');
        seccionCell.value = 'RESUMEN GENERAL';
        seccionCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        seccionCell.alignment = { horizontal: 'center', vertical: 'middle' };
        seccionCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF854D2E' }
        };
        sheet1.getRow(6).height = 22;

        sheet1.getCell('A8').value = 'Métrica';
        sheet1.getCell('B8').value = 'Valor';

        ['A8', 'B8'].forEach(addr => {
          const cell = sheet1.getCell(addr);
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF633017' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        const resumenData = [
          ['Total Inscripciones', this.resumenGeneral.totalInscripciones],
          ['Inscripciones Confirmadas', this.getInscripcionesConfirmadas()],
          ['Inscripciones Pendientes', this.getInscripcionesPendientes()],
          ['Torneos Activos', this.resumenGeneral.torneosActivos],
          ['Promedio Diario', this.resumenGeneral.promedioDiario]
        ];

        resumenData.forEach((row, index) => {
          const rowNum = 9 + index;
          sheet1.getCell(`A${rowNum}`).value = row[0];
          sheet1.getCell(`B${rowNum}`).value = row[1];
          sheet1.getCell(`B${rowNum}`).numFmt = '#,##0';
          sheet1.getCell(`B${rowNum}`).alignment = { horizontal: 'right' };
        });
      }

      // HOJA 2: TOP 10 TORNEOS
      if (this.inscripcionesPorTorneo.length > 0) {
        const sheet2 = workbook.addWorksheet('Top 10 Torneos', {
          properties: { tabColor: { argb: 'FF854D2E' } }
        });

        sheet2.getColumn(1).width = 45;
        sheet2.getColumn(2).width = 18;

        sheet2.mergeCells('A1:B1');
        const titulo2 = sheet2.getCell('A1');
        titulo2.value = 'TOP 10 TORNEOS CON MÁS INSCRITOS';
        titulo2.font = { bold: true, size: 16, color: { argb: 'FF854D2E' } };
        titulo2.alignment = { horizontal: 'center', vertical: 'middle' };
        titulo2.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE4C091' }
        };
        sheet2.getRow(1).height = 25;

        const headers2 = ['Torneo', 'Total Inscritos'];
        headers2.forEach((header, index) => {
          const cell = sheet2.getCell(3, index + 1);
          cell.value = header;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF633017' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        this.inscripcionesPorTorneo.forEach((torneo, index) => {
          const rowNum = 4 + index;
          const row = sheet2.getRow(rowNum);

          row.getCell(1).value = torneo.torneo;
          row.getCell(2).value = torneo.total;
          row.getCell(2).numFmt = '#,##0';
          row.getCell(2).alignment = { horizontal: 'right' };

          if (index % 2 === 0) {
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF9FAFB' }
              };
            });
          }
        });
      }

      // HOJA 3: DISTRIBUCIÓN POR CATEGORÍA
      if (this.distribucionCategorias.length > 0) {
        const sheet3 = workbook.addWorksheet('Distribución Categorías', {
          properties: { tabColor: { argb: 'FF854D2E' } }
        });

        sheet3.getColumn(1).width = 35;
        sheet3.getColumn(2).width = 18;
        sheet3.getColumn(3).width = 18;

        sheet3.mergeCells('A1:C1');
        const titulo3 = sheet3.getCell('A1');
        const torneoNombre = this.torneos.find(t => t.idTorneo === this.torneoSeleccionado)?.nombre || 'Torneo seleccionado';
        titulo3.value = `DISTRIBUCIÓN POR CATEGORÍA - ${torneoNombre.toUpperCase()}`;
        titulo3.font = { bold: true, size: 16, color: { argb: 'FF854D2E' } };
        titulo3.alignment = { horizontal: 'center', vertical: 'middle' };
        titulo3.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE4C091' }
        };
        sheet3.getRow(1).height = 25;

        const headers3 = ['Categoría', 'Inscritos', 'Costo'];
        headers3.forEach((header, index) => {
          const cell = sheet3.getCell(3, index + 1);
          cell.value = header;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF633017' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        this.distribucionCategorias.forEach((cat, index) => {
          const rowNum = 4 + index;
          const row = sheet3.getRow(rowNum);

          row.getCell(1).value = cat.categoria;
          row.getCell(2).value = cat.total;
          row.getCell(2).numFmt = '#,##0';
          row.getCell(2).alignment = { horizontal: 'right' };

          row.getCell(3).value = cat.costo;
          row.getCell(3).numFmt = '"$"#,##0.00';
          row.getCell(3).alignment = { horizontal: 'right' };

          if (index % 2 === 0) {
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF9FAFB' }
              };
            });
          }
        });
      }

      const filename = `Reporte_Inscripciones_${new Date().toISOString().split('T')[0]}.xlsx`;

      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        this.toast.success('Excel generado', `El archivo ${filename} se ha descargado con formato profesional`);
      });

    }).catch(error => {
      console.error('Error al exportar Excel:', error);
      this.toast.error('Error al exportar', 'No se pudo generar el Excel. Instala: npm install exceljs');
    });
  }

  private getPeriodoTexto(): string {
    const textos = {
      'dia': 'Último Día',
      'semana': 'Última Semana',
      'mes': 'Último Mes',
      'anio': 'Último Año'
    };
    return textos[this.periodoSeleccionado];
  }

  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor || 0);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const fechaSinHora = fecha.split('T')[0];
    const [year, month, day] = fechaSinHora.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day);

    return fechaLocal.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getInscripcionesConfirmadas(): number {
    if (!this.resumenGeneral?.porEstado) return 0;
    const confirmadas = this.resumenGeneral.porEstado.find((e: any) => e.estado === 'confirmado');
    return confirmadas?.total || 0;
  }

  getInscripcionesPendientes(): number {
    if (!this.resumenGeneral?.porEstado) return 0;
    const pendientes = this.resumenGeneral.porEstado.find((e: any) => e.estado === 'pendiente');
    return pendientes?.total || 0;
  }

  getPorcentajeConfirmadas(): number {
    if (!this.resumenGeneral || this.resumenGeneral.totalInscripciones === 0) return 0;
    return Math.round((this.getInscripcionesConfirmadas() / this.resumenGeneral.totalInscripciones) * 100);
  }

  ngOnDestroy(): void {
    if (this.chartEvolucion) this.chartEvolucion.destroy();
    if (this.chartPorTorneo) this.chartPorTorneo.destroy();
    if (this.chartDistribucion) this.chartDistribucion.destroy();
  }
}
