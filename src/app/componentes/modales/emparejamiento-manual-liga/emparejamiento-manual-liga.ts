import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MesaLigaService } from '../../../services/mesa-liga';
import { JugadorLigaService } from '../../../services/jugador-liga';
import { Jugador } from '../../../models/jugador';

@Component({
  selector: 'app-modal-emparejamiento-manual-liga',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './emparejamiento-manual-liga.html',
  styleUrls: ['./emparejamiento-manual-liga.css']
})
export class ModalEmparejamientoManualLigaComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() idRonda?: number;
  @Input() idLiga?: number;
  @Input() idGrupo?: number;

  @Output() cerrar = new EventEmitter<void>();
  @Output() emparejamientoCreado = new EventEmitter<void>();

  numeroMesa: number = 1;
  idJugadorBlanco: number | null = null;
  idJugadorNegro: number | null = null;
  notas: string = '';

  jugadoresDisponibles: Jugador[] = [];
  jugadoresConMesa: number[] = [];
  guardando = false;
  errorValidacion = '';

  constructor(
    private mesaLigaService: MesaLigaService,
    private jugadorLigaService: JugadorLigaService
  ) {}

  ngOnInit(): void {
    if (this.visible) {
      this.inicializarModal();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue) {
      this.inicializarModal();
    }
  }

  inicializarModal(): void {
    this.resetForm();
    this.cargarJugadoresDisponibles();
    this.calcularSiguienteNumeroMesa();
  }

  calcularSiguienteNumeroMesa(): void {
    if (!this.idRonda) return;

    this.mesaLigaService.getByRonda(this.idRonda).subscribe({
      next: (mesas) => {
        if (mesas && mesas.length > 0) {
          const numeroMaximo = Math.max(...mesas.map(m => m.numeroMesa));
          this.numeroMesa = numeroMaximo + 1;
        } else {
          this.numeroMesa = 1;
        }
      },
      error: (err) => {
        console.error('Error al calcular número de mesa:', err);
        this.numeroMesa = 1;
      }
    });
  }

  cargarJugadoresDisponibles(): void {
    if (!this.idGrupo || !this.idRonda) return;

    // Primero obtener jugadores con mesa asignada en esta ronda
    this.mesaLigaService.getByRonda(this.idRonda).subscribe({
      next: (mesas) => {
        this.jugadoresConMesa = [];
        mesas.forEach(mesa => {
          if (mesa.idJugadorBlanco) this.jugadoresConMesa.push(mesa.idJugadorBlanco);
          if (mesa.idJugadorNegro) this.jugadoresConMesa.push(mesa.idJugadorNegro);
        });

        // Luego cargar todos los jugadores del grupo
        this.jugadorLigaService.getByGrupo(this.idGrupo!).subscribe({
          next: (jugadoresLiga) => {
            this.jugadoresDisponibles = jugadoresLiga
              .filter(jl => jl.estado === 'confirmado' && jl.jugador && jl.jugador.idJugador)
              .map(jl => jl.jugador!)
              .filter(j => j.idJugador && !this.jugadoresConMesa.includes(j.idJugador));
          },
          error: (err) => {
            console.error('Error al cargar jugadores:', err);
            this.errorValidacion = 'Error al cargar la lista de jugadores';
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar mesas:', err);
      }
    });
  }

  formularioValido(): boolean {
    if (!this.numeroMesa || this.numeroMesa < 1) {
      return false;
    }

    if (!this.idJugadorBlanco || !this.idJugadorNegro) {
      return false;
    }

    if (this.idJugadorBlanco === this.idJugadorNegro) {
      return false;
    }

    // Validar que los jugadores no tengan ya mesa asignada
    if (this.jugadoresConMesa.includes(this.idJugadorBlanco) || 
        this.jugadoresConMesa.includes(this.idJugadorNegro)) {
      return false;
    }

    return true;
  }

  getNombreJugador(idJugador: number | null): string {
    if (!idJugador) return '';
    
    const jugador = this.jugadoresDisponibles.find(j => j.idJugador === idJugador);
    if (!jugador) return '';

    return `${jugador.nombre} ${jugador.apellido1} ${jugador.apellido2 || ''}`.trim();
  }

  guardarMesa(): void {
    if (!this.formularioValido() || !this.idRonda) {
      this.errorValidacion = 'Por favor completa todos los campos correctamente';
      return;
    }

    if (this.idJugadorBlanco === this.idJugadorNegro) {
      this.errorValidacion = 'Un jugador no puede enfrentarse a sí mismo';
      return;
    }

    this.guardando = true;
    this.errorValidacion = '';

    const mesaDto = {
      numeroMesa: this.numeroMesa,
      idRondaLiga: this.idRonda,
      idJugadorBlanco: this.idJugadorBlanco!,
      idJugadorNegro: this.idJugadorNegro!,
      notas: this.notas || undefined
    };

    this.mesaLigaService.create(mesaDto).subscribe({
      next: () => {
        this.emparejamientoCreado.emit();
        this.cerrar.emit();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error al crear mesa:', err);
        this.errorValidacion = err.error?.message || 'Error al crear la mesa. Intenta nuevamente.';
        this.guardando = false;
      }
    });
  }

  resetForm(): void {
    this.numeroMesa = 1;
    this.idJugadorBlanco = null;
    this.idJugadorNegro = null;
    this.notas = '';
    this.guardando = false;
    this.errorValidacion = '';
  }

  onCerrar(): void {
    this.resetForm();
    this.cerrar.emit();
  }
}
