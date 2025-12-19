import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-graficas-estadisticas',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './graficas-estadisticas.html',
  styleUrl: './graficas-estadisticas.css',
})
export class GraficasEstadisticasComponent implements OnInit, OnChanges {
  @Input() estadisticasGenerales: any = null;
  @Input() estadisticasPorCategoria: any[] = [];
  @Input() estadisticasPorTorneo: any[] = [];
  @Input() evolucionTemporal: any[] = [];

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  // Gráfica de recaudación general (Dona)
  public chartRecaudacionData: ChartData<'doughnut'> = {
    labels: ['Pagos Completos', 'Pagos Parciales', 'Sin Pago'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }]
  };

  public chartRecaudacionOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed || 0;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#FFFFFF',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: (value, context) => {
          const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
          return value > 0 ? `${value}\n${percentage}%` : '';
        }
      }
    }
  };

  // Gráfica de recaudación por torneo (Barras)
  public chartTorneosData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Recaudado',
        data: [],
        backgroundColor: '#854D2E',
        borderRadius: 6
      },
      {
        label: 'Esperado',
        data: [],
        backgroundColor: '#E3E1DD',
        borderRadius: 6
      }
    ]
  };

  public chartTorneosOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            return `${context.dataset.label}: $${value.toFixed(2)}`;
          }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#854D2E',
        font: {
          weight: 'bold',
          size: 11
        },
        formatter: (value) => {
          return value > 0 ? `$${value.toFixed(0)}` : '';
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '$' + value;
          }
        }
      }
    }
  };

  // Gráfica de categorías (Barras)
  public chartCategoriasData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Recaudado',
        data: [],
        backgroundColor: '#854D2E',
        borderRadius: 6
      },
      {
        label: 'Esperado',
        data: [],
        backgroundColor: '#E3E1DD',
        borderRadius: 6
      }
    ]
  };

  public chartCategoriasOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x || 0;
            return `${context.dataset.label}: $${value.toFixed(2)}`;
          }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'right',
        color: '#854D2E',
        font: {
          weight: 'bold',
          size: 11
        },
        formatter: (value) => {
          return value > 0 ? `$${value.toFixed(0)}` : '';
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '$' + value;
          }
        }
      }
    }
  };

  // Gráfica de evolución (Línea)
  public chartEvolucionData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Total Recaudado',
        data: [],
        borderColor: '#854D2E',
        backgroundColor: 'rgba(133, 77, 46, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        label: 'Total Esperado',
        data: [],
        borderColor: '#E3E1DD',
        backgroundColor: 'rgba(227, 225, 221, 0.1)',
        fill: false,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  public chartEvolucionOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            return `${context.dataset.label}: $${value.toFixed(2)}`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '$' + value;
          }
        }
      }
    }
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    Chart.register(ChartDataLabels);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estadisticasGenerales'] || 
        changes['estadisticasPorCategoria'] || 
        changes['estadisticasPorTorneo'] || 
        changes['evolucionTemporal']) {
      this.actualizarGraficas();
    }
  }

  actualizarGraficas(): void {
    if (!this.estadisticasGenerales) {
      return;
    }

    // Actualizar gráfica de recaudación
    this.chartRecaudacionData = {
      labels: ['Pagos Completos', 'Pagos Parciales', 'Sin Pago'],
      datasets: [{
        data: [
          Number(this.estadisticasGenerales.pagos_completos) || 0,
          Number(this.estadisticasGenerales.pagos_parciales) || 0,
          Number(this.estadisticasGenerales.sin_pago) || 0
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }]
    };

    // Actualizar gráfica de torneos (top 5)
    if (this.estadisticasPorTorneo && this.estadisticasPorTorneo.length > 0) {
      const torneosConDatos = this.estadisticasPorTorneo.filter(t =>
        (Number(t.total_inscripciones) > 0) ||
        (Number(t.total_recaudado) > 0) ||
        (Number(t.total_esperado) > 0)
      );

      const top5Torneos = torneosConDatos.slice(0, 5);

      if (top5Torneos.length > 0) {
        this.chartTorneosData = {
          labels: top5Torneos.map(t => t.torneo),
          datasets: [
            {
              label: 'Recaudado',
              data: top5Torneos.map(t => Number(t.total_recaudado) || 0),
              backgroundColor: '#854D2E',
              borderRadius: 6
            },
            {
              label: 'Esperado',
              data: top5Torneos.map(t => Number(t.total_esperado) || 0),
              backgroundColor: '#E3E1DD',
              borderRadius: 6
            }
          ]
        };
      } else {
        this.chartTorneosData = {
          labels: [],
          datasets: [
            {
              label: 'Recaudado',
              data: [],
              backgroundColor: '#854D2E',
              borderRadius: 6
            },
            {
              label: 'Esperado',
              data: [],
              backgroundColor: '#E3E1DD',
              borderRadius: 6
            }
          ]
        };
      }
    } else {
      this.chartTorneosData = {
        labels: [],
        datasets: [
          {
            label: 'Recaudado',
            data: [],
            backgroundColor: '#854D2E',
            borderRadius: 6
          },
          {
            label: 'Esperado',
            data: [],
            backgroundColor: '#E3E1DD',
            borderRadius: 6
          }
        ]
      };
    }

    // Actualizar gráfica de categorías
    if (this.estadisticasPorCategoria && this.estadisticasPorCategoria.length > 0) {
      this.chartCategoriasData = {
        labels: this.estadisticasPorCategoria.map(c => c.categoria),
        datasets: [
          {
            label: 'Recaudado',
            data: this.estadisticasPorCategoria.map(c => Number(c.total_recaudado) || 0),
            backgroundColor: '#854D2E',
            borderRadius: 6
          },
          {
            label: 'Esperado',
            data: this.estadisticasPorCategoria.map(c => Number(c.total_esperado) || 0),
            backgroundColor: '#E3E1DD',
            borderRadius: 6
          }
        ]
      };
    } else {
      this.chartCategoriasData = {
        labels: [],
        datasets: [
          {
            label: 'Recaudado',
            data: [],
            backgroundColor: '#854D2E',
            borderRadius: 6
          },
          {
            label: 'Esperado',
            data: [],
            backgroundColor: '#E3E1DD',
            borderRadius: 6
          }
        ]
      };
    }

    // Actualizar gráfica de evolución temporal
    if (this.evolucionTemporal && this.evolucionTemporal.length > 0) {      
      const labels = this.evolucionTemporal.map(e => e.periodo);
      const recaudado = this.evolucionTemporal.map(e => Number(e.total_recaudado) || 0);
      const esperado = this.evolucionTemporal.map(e => Number(e.total_esperado) || 0);
      
      this.chartEvolucionData = {
        labels: labels,
        datasets: [
          {
            label: 'Total Recaudado',
            data: recaudado,
            borderColor: '#854D2E',
            backgroundColor: 'rgba(133, 77, 46, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Total Esperado',
            data: esperado,
            borderColor: '#E3E1DD',
            backgroundColor: 'rgba(227, 225, 221, 0.1)',
            fill: false,
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      };
      
      // Forzar actualización de la gráfica
      setTimeout(() => {
        if (this.chart) {
          this.chart.update();
        }
      }, 0);
      
      this.cdr.detectChanges();
    } else {
      this.chartEvolucionData = {
        labels: [],
        datasets: [
          {
            label: 'Total Recaudado',
            data: [],
            borderColor: '#854D2E',
            backgroundColor: 'rgba(133, 77, 46, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Total Esperado',
            data: [],
            borderColor: '#E3E1DD',
            backgroundColor: 'rgba(227, 225, 221, 0.1)',
            fill: false,
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      };
    }
  }
}