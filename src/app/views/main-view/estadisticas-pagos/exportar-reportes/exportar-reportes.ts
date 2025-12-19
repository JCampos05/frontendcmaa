import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportModalComponent } from '../../../../componentes/modales/export-modal/export-modal';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';

interface FiltrosTemporal {
  fechaInicio: string;
  fechaFin: string;
  tipoPeriodo: 'dia' | 'semana' | 'mes' | 'anio';
}

@Component({
  selector: 'app-exportador-reportes',
  standalone: true,
  imports: [CommonModule, ExportModalComponent, ToastNoti],
  templateUrl: './exportar-reportes.html',
  styleUrl: './exportar-reportes.css',
})
export class ExportadorReportesComponent {
  @Input() estadisticasGenerales: any = null;
  @Input() estadisticasPorCategoria: any[] = [];
  @Input() estadisticasPorTorneo: any[] = [];
  @Input() evolucionTemporal: any[] = [];
  @Input() comparativaAnual: any[] = [];
  @Input() filtros!: FiltrosTemporal;

  @Output() reporteGenerado = new EventEmitter<string>();

  @ViewChild(ExportModalComponent) exportModal!: ExportModalComponent;
  @ViewChild(ToastNoti) toast!: ToastNoti;

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

private exportarPDFMejorado(tipoContenido: 'datos' | 'graficas' | 'completo'): void {
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
      const filename = `Reporte_${tipoTexto}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      this.toast.success('PDF generado', `El archivo ${filename} se ha descargado correctamente`);
      this.reporteGenerado.emit(filename);
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
    doc.text('Reporte de Estadísticas de Pagos', logoBase64 ? 45 : 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${this.formatearFecha(this.filtros.fechaInicio)} - ${this.formatearFecha(this.filtros.fechaFin)}`, logoBase64 ? 45 : 14, 28);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, logoBase64 ? 45 : 14, 33);

    doc.setDrawColor(227, 225, 221);
    doc.line(14, 36, 196, 36);
  }

private agregarDatosPDF(doc: any, autoTableModule: any, yPosition: number): number {
  if (this.estadisticasGenerales) {
    doc.setFontSize(14);
    doc.setTextColor(133, 77, 46);
    doc.text('Resumen General', 14, yPosition);
    yPosition += 8;

    const resumenData = [
      ['Total Recaudado', this.formatearMoneda(this.estadisticasGenerales.total_recaudado)],
      ['Total Esperado', this.formatearMoneda(this.estadisticasGenerales.total_esperado)],
      ['Porcentaje de Recaudación', `${this.estadisticasGenerales.porcentaje_recaudacion}%`],
      ['Pagos Completos', this.estadisticasGenerales.pagos_completos.toString()],
      ['Pagos Parciales', this.estadisticasGenerales.pagos_parciales.toString()],
      ['Sin Pago', this.estadisticasGenerales.sin_pago.toString()],
      ['Total Inscripciones', this.estadisticasGenerales.total_inscripciones.toString()],
      ['Promedio por Pago', this.formatearMoneda(this.estadisticasGenerales.promedio_pago)]
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

  if (this.estadisticasPorCategoria.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(133, 77, 46);
    doc.text('Estadísticas por Categoría', 14, yPosition);
    yPosition += 8;

    const categoriaData = this.estadisticasPorCategoria.map(cat => [
      cat.categoria,
      cat.total_inscripciones.toString(),
      cat.pagos_completos.toString(),
      this.formatearMoneda(cat.total_recaudado),
      this.formatearMoneda(cat.total_esperado),
      `${cat.porcentaje_recaudacion}%`
    ]);

    autoTableModule.default(doc, {
      startY: yPosition,
      head: [['Categoría', 'Inscripciones', 'Pagos Completos', 'Recaudado', 'Esperado', '% Recaudación']],
      body: categoriaData,
      theme: 'striped',
      headStyles: { fillColor: [133, 77, 46] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  if (this.estadisticasPorTorneo.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(133, 77, 46);
    doc.text('Estadísticas por Torneo', 14, yPosition);
    yPosition += 8;

    const torneoData = this.estadisticasPorTorneo.map(torneo => [
      torneo.torneo,
      this.formatearFecha(torneo.fecha),
      torneo.lugar,
      torneo.total_inscripciones.toString(),
      this.formatearMoneda(torneo.total_recaudado),
      `${torneo.porcentaje_recaudacion}%`
    ]);

    autoTableModule.default(doc, {
      startY: yPosition,
      head: [['Torneo', 'Fecha', 'Lugar', 'Inscripciones', 'Recaudado', '% Recaudación']],
      body: torneoData,
      theme: 'striped',
      headStyles: { fillColor: [133, 77, 46] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 }
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
    { selector: '.grafica-card:nth-child(1) canvas', titulo: 'Distribución de Pagos', altura: 80 },
    { selector: '.grafica-card:nth-child(2) canvas', titulo: 'Recaudación por Torneo', altura: 70 },
    { selector: '.grafica-card.full-width canvas', titulo: 'Evolución Temporal', altura: 70 },
    { selector: '.grafica-card:nth-of-type(4) canvas', titulo: 'Recaudación por Categoría', altura: 70 }
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
      const filename = `Reporte_${tipoTexto}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      this.toast.success('PDF generado', `El archivo ${filename} se ha descargado correctamente`);
      this.reporteGenerado.emit(filename);
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

  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor || 0);
  }

  private formatearFecha(fecha: string): string {
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

  private exportarExcelMejorado(): void {
    import('exceljs').then((ExcelJSModule) => {
      const ExcelJS = ExcelJSModule.default;
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Comité de Ajedrez';
      workbook.created = new Date();

      // HOJA 1: RESUMEN GENERAL
      if (this.estadisticasGenerales) {
        const sheet1 = workbook.addWorksheet('Resumen General', {
          properties: { tabColor: { argb: 'FF854D2E' } }
        });

        sheet1.getColumn(1).width = 32;
        sheet1.getColumn(2).width = 20;

        sheet1.mergeCells('A1:B1');
        const tituloCell = sheet1.getCell('A1');
        tituloCell.value = 'REPORTE DE ESTADÍSTICAS DE PAGOS';
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
        sheet1.getCell('B3').value = `${this.formatearFecha(this.filtros.fechaInicio)} - ${this.formatearFecha(this.filtros.fechaFin)}`;

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
          ['Total Recaudado', this.estadisticasGenerales.total_recaudado, 'currency'],
          ['Total Esperado', this.estadisticasGenerales.total_esperado, 'currency'],
          ['Porcentaje de Recaudación', this.estadisticasGenerales.porcentaje_recaudacion / 100, 'percent'],
          ['Pagos Completos', this.estadisticasGenerales.pagos_completos, 'number'],
          ['Pagos Parciales', this.estadisticasGenerales.pagos_parciales, 'number'],
          ['Sin Pago', this.estadisticasGenerales.sin_pago, 'number'],
          ['Total Inscripciones', this.estadisticasGenerales.total_inscripciones, 'number'],
          ['Promedio por Pago', this.estadisticasGenerales.promedio_pago, 'currency']
        ];

        resumenData.forEach((row, index) => {
          const rowNum = 9 + index;
          sheet1.getCell(`A${rowNum}`).value = row[0];
          sheet1.getCell(`B${rowNum}`).value = row[1];

          const valueCell = sheet1.getCell(`B${rowNum}`);
          valueCell.alignment = { horizontal: 'right' };

          if (row[2] === 'currency') {
            valueCell.numFmt = '"$"#,##0.00';
          } else if (row[2] === 'percent') {
            valueCell.numFmt = '0.00%';
          } else if (row[2] === 'number') {
            valueCell.numFmt = '#,##0';
          }
        });
      }

      // HOJA 2: POR CATEGORÍA
      if (this.estadisticasPorCategoria.length > 0) {
        const sheet2 = workbook.addWorksheet('Por Categoría', {
          properties: { tabColor: { argb: 'FF854D2E' } }
        });

        sheet2.getColumn(1).width = 18;
        sheet2.getColumn(2).width = 15;
        sheet2.getColumn(3).width = 18;
        sheet2.getColumn(4).width = 18;
        sheet2.getColumn(5).width = 18;
        sheet2.getColumn(6).width = 18;
        sheet2.getColumn(7).width = 18;

        sheet2.mergeCells('A1:G1');
        const titulo2 = sheet2.getCell('A1');
        titulo2.value = 'ESTADÍSTICAS POR CATEGORÍA';
        titulo2.font = { bold: true, size: 16, color: { argb: 'FF854D2E' } };
        titulo2.alignment = { horizontal: 'center', vertical: 'middle' };
        titulo2.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE4C091' }
        };
        sheet2.getRow(1).height = 25;

        const headers2 = ['Categoría', 'Inscripciones', 'Pagos Completos', 'Pagos Parciales',
          'Total Recaudado', 'Total Esperado', '% Recaudación'];
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

        this.estadisticasPorCategoria.forEach((cat, index) => {
          const rowNum = 4 + index;
          const row = sheet2.getRow(rowNum);

          row.getCell(1).value = cat.categoria;
          row.getCell(2).value = cat.total_inscripciones;
          row.getCell(2).numFmt = '#,##0';
          row.getCell(2).alignment = { horizontal: 'right' };

          row.getCell(3).value = cat.pagos_completos;
          row.getCell(3).numFmt = '#,##0';
          row.getCell(3).alignment = { horizontal: 'right' };

          row.getCell(4).value = cat.pagos_parciales;
          row.getCell(4).numFmt = '#,##0';
          row.getCell(4).alignment = { horizontal: 'right' };

          row.getCell(5).value = cat.total_recaudado;
          row.getCell(5).numFmt = '"$"#,##0.00';
          row.getCell(5).alignment = { horizontal: 'right' };

          row.getCell(6).value = cat.total_esperado;
          row.getCell(6).numFmt = '"$"#,##0.00';
          row.getCell(6).alignment = { horizontal: 'right' };

          row.getCell(7).value = cat.porcentaje_recaudacion / 100;
          row.getCell(7).numFmt = '0.00%';
          row.getCell(7).alignment = { horizontal: 'right' };

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

      // HOJA 3: POR TORNEO
      if (this.estadisticasPorTorneo.length > 0) {
        const sheet3 = workbook.addWorksheet('Por Torneo', {
          properties: { tabColor: { argb: 'FF854D2E' } }
        });

        sheet3.getColumn(1).width = 35;
        sheet3.getColumn(2).width = 15;
        sheet3.getColumn(3).width = 30;
        sheet3.getColumn(4).width = 15;
        sheet3.getColumn(5).width = 18;
        sheet3.getColumn(6).width = 18;

        sheet3.mergeCells('A1:F1');
        const titulo3 = sheet3.getCell('A1');
        titulo3.value = 'ESTADÍSTICAS POR TORNEO';
        titulo3.font = { bold: true, size: 16, color: { argb: 'FF854D2E' } };
        titulo3.alignment = { horizontal: 'center', vertical: 'middle' };
        titulo3.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE4C091' }
        };
        sheet3.getRow(1).height = 25;

        const headers3 = ['Torneo', 'Fecha', 'Lugar', 'Inscripciones', 'Total Recaudado', '% Recaudación'];
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

        this.estadisticasPorTorneo.forEach((torneo, index) => {
          const rowNum = 4 + index;
          const row = sheet3.getRow(rowNum);

          row.getCell(1).value = torneo.torneo;
          row.getCell(2).value = this.formatearFecha(torneo.fecha);
          row.getCell(3).value = torneo.lugar;

          row.getCell(4).value = torneo.total_inscripciones;
          row.getCell(4).numFmt = '#,##0';
          row.getCell(4).alignment = { horizontal: 'right' };

          row.getCell(5).value = torneo.total_recaudado;
          row.getCell(5).numFmt = '"$"#,##0.00';
          row.getCell(5).alignment = { horizontal: 'right' };

          row.getCell(6).value = torneo.porcentaje_recaudacion / 100;
          row.getCell(6).numFmt = '0.00%';
          row.getCell(6).alignment = { horizontal: 'right' };

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

      // HOJA 4: EVOLUCIÓN TEMPORAL
      if (this.evolucionTemporal.length > 0) {
        const sheet4 = workbook.addWorksheet('Evolución Temporal', {
          properties: { tabColor: { argb: 'FF854D2E' } }
        });

        sheet4.getColumn(1).width = 20;
        sheet4.getColumn(2).width = 18;
        sheet4.getColumn(3).width = 18;
        sheet4.getColumn(4).width = 15;

        sheet4.mergeCells('A1:D1');
        const titulo4 = sheet4.getCell('A1');
        titulo4.value = 'EVOLUCIÓN TEMPORAL';
        titulo4.font = { bold: true, size: 16, color: { argb: 'FF854D2E' } };
        titulo4.alignment = { horizontal: 'center', vertical: 'middle' };
        titulo4.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE4C091' }
        };
        sheet4.getRow(1).height = 25;

        const headers4 = ['Período', 'Total Recaudado', 'Total Esperado', 'Inscripciones'];
        headers4.forEach((header, index) => {
          const cell = sheet4.getCell(3, index + 1);
          cell.value = header;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF633017' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        this.evolucionTemporal.forEach((ev, index) => {
          const rowNum = 4 + index;
          const row = sheet4.getRow(rowNum);

          row.getCell(1).value = ev.periodo;

          row.getCell(2).value = ev.total_recaudado;
          row.getCell(2).numFmt = '"$"#,##0.00';
          row.getCell(2).alignment = { horizontal: 'right' };

          row.getCell(3).value = ev.total_esperado;
          row.getCell(3).numFmt = '"$"#,##0.00';
          row.getCell(3).alignment = { horizontal: 'right' };

          row.getCell(4).value = ev.total_inscripciones;
          row.getCell(4).numFmt = '#,##0';
          row.getCell(4).alignment = { horizontal: 'right' };

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

      const filename = `Reporte_Estadisticas_${new Date().toISOString().split('T')[0]}.xlsx`;

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

        this.toast.success('Excel generado', `El archivo ${filename} se ha descargado`);
        this.reporteGenerado.emit(filename);
      });

    }).catch(error => {
      console.error('Error al exportar Excel:', error);
      this.toast.error('Error al exportar', 'No se pudo generar el Excel');
    });
  }
}