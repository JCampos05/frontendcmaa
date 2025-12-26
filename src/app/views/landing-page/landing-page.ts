import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TorneoService } from '../../services/torneo/torneo';
import { Torneo } from '../../models/torneo';
import { TorneoDetalleModalComponent } from '../../componentes/modales/torneo-detalle/torneo-detalle';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, TorneoDetalleModalComponent],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingComponent implements OnInit {
  torneoDestacado: Torneo | null = null;
  proximosTorneos: Torneo[] = [];
  loading = true;

  modalAbierto = false;
  torneoSeleccionado: Torneo | null = null;
  faqs = [
    {
      pregunta: '¿Cuáles son mis datos como jugador?',
      respuesta: 'Puedes consultar tus estadísticas, historial de torneos y rating en la sección de Jugadores del menú principal.',
      abierto: false
    },
    {
      pregunta: '¿Cómo me inscribo a un torneo?',
      respuesta: 'Debes ir a un torneo programado, ingresar en "Inscribirme ahora" e ingresar los datos que te pide en el proceso de inscripcion.',
      abierto: false
    },
    {
      pregunta: '¿Cuál es el costo de inscripción?',
      respuesta: 'El costo varía según la categoría del torneo. Puedes consultar los precios en la sección de información cada torneo.',
      abierto: false
    },
    {
      pregunta: '¿Qué sistemas de juego se utilizan?',
      respuesta: 'Utilizamos principalmente el sistema Suizo y Round Robin, dependiendo del número de participantes y la categoría.',
      abierto: false
    }
  ];

  constructor(
    private torneoService: TorneoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTorneos();
  }

  cargarTorneos(): void {
    this.torneoService.getActivos().subscribe({
      next: (torneos) => {
        const torneosOrdenados = torneos.sort((a, b) => {
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          return fechaA - fechaB;
        });

        if (torneosOrdenados.length > 0) {
          this.torneoDestacado = torneosOrdenados[0];
          this.proximosTorneos = torneosOrdenados.length > 1 ? torneosOrdenados.slice(1, 4) : [];
        } else {
          this.torneoDestacado = null;
          this.proximosTorneos = [];
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar torneos:', error);
        this.loading = false;
      }
    });
  }

  toggleFaq(index: number): void {
    this.faqs[index].abierto = !this.faqs[index].abierto;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  }

  irAInscripcion(torneoId?: number): void {
    if (torneoId) {
      console.log('Navegando a inscripción con ID:', torneoId);
      this.router.navigate(['/inscripcion', torneoId]).then(
        success => console.log('Navegación exitosa:', success),
        error => console.error('Error en navegación:', error)
      );
    } else {
      console.error('No se proporcionó ID de torneo');
    }
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getDia(fecha: Date | string): number {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    return parseInt(day, 10);
  }

  getMes(fecha: Date | string): string {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase();
  }

  formatearFechaCorta(fecha: Date | string): string {
    if (!fecha) return '';

    try {
      const date = new Date(fecha);

      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return '';
    }
  }

  getSistemaCompetencia(torneo: Torneo): string {
    if (torneo.torneoCategoria && torneo.torneoCategoria.length > 0) {
      return torneo.torneoCategoria[0].sistemaCompetencia
        || torneo.torneoCategoria[0].sistema_competencia
        || 'No especificado';
    }
    if (torneo.torneo_categorias && torneo.torneo_categorias.length > 0) {
      return torneo.torneo_categorias[0].sistemaCompetencia
        || torneo.torneo_categorias[0].sistema_competencia
        || 'No especificado';
    }
    return 'No especificado';
  }

  abrirModal(torneo: Torneo): void {
    this.torneoSeleccionado = torneo;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.torneoSeleccionado = null;
  }

  // NUEVA FUNCIÓN: Verificar si las inscripciones están cerradas
  inscripcionesCerradas(torneo: Torneo): boolean {
    const cierreInscripciones = torneo.cierreInscripciones || torneo.cierre_inscripciones;
    //console.log('Cierre inscripciones desde BD:', cierreInscripciones);

    if (!cierreInscripciones) {
      return false;
    }

    try {
      // Crear fecha de cierre interpretándola como hora local de Los Mochis
      const fechaCierreStr = typeof cierreInscripciones === 'string'
        ? cierreInscripciones
        : cierreInscripciones.toISOString();

      // Extraer los componentes de la fecha (año, mes, día, hora, minuto)
      const [datePart, timePart] = fechaCierreStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);

      // Crear fecha en zona horaria local (Los Mochis)
      const fechaCierre = new Date(year, month - 1, day, hour, minute);

      // Obtener hora actual en zona horaria local
      const ahora = new Date();

      //console.log('Fecha cierre (local):', fechaCierre);
      //console.log('Fecha actual (local):', ahora);
      //console.log('¿Inscripciones cerradas?:', ahora >= fechaCierre);

      return ahora >= fechaCierre;
    } catch (e) {
      //console.error('Error al verificar cierre de inscripciones:', e);
      return false;
    }
  }

  // NUEVA FUNCIÓN: Obtener el mensaje de estado de inscripciones
  getMensajeInscripcion(torneo: Torneo): string {
    if (this.inscripcionesCerradas(torneo)) {
      return 'Inscripciones cerradas';
    }
    return 'Inscribirme Ahora';
  }
}