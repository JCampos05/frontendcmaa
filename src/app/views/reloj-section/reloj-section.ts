import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface ConfiguracionReloj {
  tiempoInicial: number;
  incremento: number;
}

@Component({
  selector: 'app-reloj-section',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reloj-section.html',
  styleUrls: ['./reloj-section.css']
})
export class RelojSectionComponent implements OnInit, OnDestroy {
  // Configuración
  minutosBlancas: number = 10;
  segundosBlancas: number = 0;
  minutosNegras: number = 10;
  segundosNegras: number = 0;
  incrementoBlancas: number = 0;
  incrementoNegras: number = 0;

  // Estado del reloj
  tiempoBlancas: number = 600; // en segundos
  tiempoNegras: number = 600; // en segundos
  turnoActual: 'blancas' | 'negras' | null = null;
  enPausa: boolean = true;
  modalAbierto: boolean = false;

  // Intervalo
  private intervalo: any = null;

  // Configuración en edición (modal)
  editandoTiempo: boolean = false;
  minutosEditBlancas: number = 10;
  segundosEditBlancas: number = 0;
  minutosEditNegras: number = 10;
  segundosEditNegras: number = 0;
  incrementoEditBlancas: number = 0;
  incrementoEditNegras: number = 0;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  iniciarReloj(): void {
    // Convertir minutos y segundos a segundos totales
    this.tiempoBlancas = (this.minutosBlancas * 60) + this.segundosBlancas;
    this.tiempoNegras = (this.minutosNegras * 60) + this.segundosNegras;
    
    this.turnoActual = 'blancas';
    this.enPausa = false;
    this.modalAbierto = true;
    
    this.iniciarIntervalo();
  }

  iniciarIntervalo(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }

    this.intervalo = setInterval(() => {
      if (!this.enPausa && this.turnoActual) {
        if (this.turnoActual === 'blancas') {
          this.tiempoBlancas--;
          if (this.tiempoBlancas <= 0) {
            this.tiempoBlancas = 0;
            this.detenerReloj();
          }
        } else {
          this.tiempoNegras--;
          if (this.tiempoNegras <= 0) {
            this.tiempoNegras = 0;
            this.detenerReloj();
          }
        }
      }
    }, 1000);
  }

  cambiarTurno(): void {
    if (this.enPausa || !this.turnoActual) return;

    // Agregar incremento al jugador que termina su turno
    if (this.turnoActual === 'blancas') {
      this.tiempoBlancas += this.incrementoBlancas;
      this.turnoActual = 'negras';
    } else {
      this.tiempoNegras += this.incrementoNegras;
      this.turnoActual = 'blancas';
    }
  }

  pausarReanudar(): void {
    this.enPausa = !this.enPausa;
  }

  detenerReloj(): void {
    this.enPausa = true;
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  reiniciarReloj(): void {
    this.detenerReloj();
    this.tiempoBlancas = (this.minutosBlancas * 60) + this.segundosBlancas;
    this.tiempoNegras = (this.minutosNegras * 60) + this.segundosNegras;
    this.turnoActual = 'blancas';
    this.enPausa = true;
  }

  cerrarModal(): void {
    this.detenerReloj();
    this.modalAbierto = false;
    this.turnoActual = null;
  }

  abrirEdicion(): void {
    this.editandoTiempo = true;
    this.minutosEditBlancas = Math.floor(this.tiempoBlancas / 60);
    this.segundosEditBlancas = this.tiempoBlancas % 60;
    this.minutosEditNegras = Math.floor(this.tiempoNegras / 60);
    this.segundosEditNegras = this.tiempoNegras % 60;
    this.incrementoEditBlancas = this.incrementoBlancas;
    this.incrementoEditNegras = this.incrementoNegras;
  }

  guardarEdicion(): void {
    this.tiempoBlancas = (this.minutosEditBlancas * 60) + this.segundosEditBlancas;
    this.tiempoNegras = (this.minutosEditNegras * 60) + this.segundosEditNegras;
    this.incrementoBlancas = this.incrementoEditBlancas;
    this.incrementoNegras = this.incrementoEditNegras;
    
    // Actualizar también la configuración base
    this.minutosBlancas = this.minutosEditBlancas;
    this.segundosBlancas = this.segundosEditBlancas;
    this.minutosNegras = this.minutosEditNegras;
    this.segundosNegras = this.segundosEditNegras;
    
    this.editandoTiempo = false;
  }

  cancelarEdicion(): void {
    this.editandoTiempo = false;
  }

  formatearTiempo(segundosTotales: number): string {
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }

  obtenerClaseReloj(color: 'blancas' | 'negras'): string {
    const clases = ['reloj-display'];
    
    if (this.turnoActual === color && !this.enPausa) {
      clases.push('activo');
    }
    
    const tiempo = color === 'blancas' ? this.tiempoBlancas : this.tiempoNegras;
    if (tiempo <= 30 && tiempo > 10) {
      clases.push('warning');
    } else if (tiempo <= 10) {
      clases.push('danger');
    }
    
    return clases.join(' ');
  }
}