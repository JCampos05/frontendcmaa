import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JugadorSimilar } from '../../../services/inscripcion-publica';

@Component({
  selector: 'app-jugador-similar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jugador-similar.html',
  styleUrl: './jugador-similar.css'
})
export class JugadorSimilarComponent {
  @Input() mostrar = false;
  @Input() candidatos: JugadorSimilar[] = [];

  @Output() seleccionar = new EventEmitter<JugadorSimilar>();
  @Output() ningunoDeEstos = new EventEmitter<void>();

  onSeleccionar(jugador: JugadorSimilar): void {
    this.seleccionar.emit(jugador);
  }

  onNingunoDeEstos(): void {
    this.ningunoDeEstos.emit();
  }

  nombreCompleto(j: JugadorSimilar): string {
    return `${j.nombre} ${j.apellido1}${j.apellido2 ? ' ' + j.apellido2 : ''}`;
  }

  ultimaInscripcion(j: JugadorSimilar): string | null {
    const ultima = j.inscripciones?.[0];
    if (!ultima) return null;
    const fecha = new Date(ultima.torneo.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
    return `${ultima.torneo.nombre} · ${ultima.categoria.nombre} · ${fecha}`;
  }
}
