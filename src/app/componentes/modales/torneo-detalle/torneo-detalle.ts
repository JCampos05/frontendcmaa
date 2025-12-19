import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Torneo } from '../../../models/torneo';
import { TorneoCategoria } from '../../../models/torneo-categoria';

@Component({
  selector: 'app-torneo-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './torneo-detalle.html',
  styleUrls: ['./torneo-detalle.css']
})
export class TorneoDetalleModalComponent {
  @Input() torneo: Torneo | null = null;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  cerrarModal(): void {
    this.close.emit();
  }

  detenerPropagacion(event: Event): void {
    event.stopPropagation();
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearFechaCorta(fecha: Date | string): string {
    if (!fecha) return 'No especificado';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return 'No especificado';
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'No especificado';
    }
  }

  formatearFechaRonda(fecha: string): string {
    if (!fecha) return 'Por definir';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return 'Por definir';
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Por definir';
    }
  }

  getCategorias(): TorneoCategoria[] {
    if (!this.torneo) return [];
    
    // Intentar ambos alias del backend
    const categorias = this.torneo.torneoCategoria || this.torneo.torneo_categorias;
    
    if (!categorias || !Array.isArray(categorias)) return [];
    
    // Filtrar solo categorías activas
    return categorias.filter(cat => cat.activo !== false);
  }

  getRitmoJuego(categoria: TorneoCategoria): string {
    return categoria.ritmoJuego || categoria.ritmo_juego || 'No especificado';
  }

  getSistemaCompetencia(categoria: TorneoCategoria): string {
    return categoria.sistemaCompetencia || categoria.sistema_competencia || 'No especificado';
  }

  getPremios(categoria: TorneoCategoria): string[] {
    if (!categoria.premios) return [];
    
    try {
      const premiosObj = typeof categoria.premios === 'string' 
        ? JSON.parse(categoria.premios) 
        : categoria.premios;
      
      const premiosArray: string[] = [];
      
      // Ordenar las claves numéricamente
      const claves = Object.keys(premiosObj).sort((a, b) => parseInt(a) - parseInt(b));
      
      claves.forEach(key => {
        const numero = parseInt(key);
        const lugar = this.obtenerNombreLugar(numero);
        const valor = premiosObj[key];
        
        // Limpiar el valor si viene en formato "monto - descripción"
        let valorLimpio = valor;
        if (typeof valor === 'string' && valor.includes(' - ')) {
          const partes = valor.split(' - ');
          valorLimpio = partes[0]; // Solo tomar la parte del monto
        }
        
        premiosArray.push(`${lugar}: ${valorLimpio}`);
      });
      
      return premiosArray;
    } catch (e) {
      console.error('Error al parsear premios:', e);
      return [];
    }
  }

  obtenerNombreLugar(numero: number): string {
    const lugares: { [key: number]: string } = {
      1: '1er lugar',
      2: '2do lugar',
      3: '3er lugar',
      4: '4to lugar',
      5: '5to lugar'
    };
    return lugares[numero] || `${numero}º lugar`;
  }

  getDesempates(categoria: TorneoCategoria): string[] {
    if (!categoria.desempates) return [];
    
    try {
      const desempates = typeof categoria.desempates === 'string' 
        ? JSON.parse(categoria.desempates) 
        : categoria.desempates;
      
      return Array.isArray(desempates) ? desempates : [];
    } catch (e) {
      console.error('Error al parsear desempates:', e);
      return [];
    }
  }

  getCalendario(categoria: TorneoCategoria): any[] {
    if (!categoria.calendario) return [];
    
    try {
      const calendario = typeof categoria.calendario === 'string' 
        ? JSON.parse(categoria.calendario) 
        : categoria.calendario;
      
      return Array.isArray(calendario) ? calendario : [];
    } catch (e) {
      console.error('Error al parsear calendario:', e);
      return [];
    }
  }

  getCierreInscripciones(): Date | string | undefined {
    if (!this.torneo) return undefined;
    return this.torneo.cierreInscripciones || this.torneo.cierre_inscripciones;
  }

  hayInformacionAdicional(categoria: TorneoCategoria): boolean {
    return this.getPremios(categoria).length > 0 
      || this.getDesempates(categoria).length > 0 
      || this.getCalendario(categoria).length > 0;
  }
}