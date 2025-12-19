import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface OpcionesExportacion {
  formato: 'pdf' | 'excel';
  tipoContenido: 'datos' | 'graficas' | 'completo';
}

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './export-modal.html',
  styleUrls: ['./export-modal.css']
})
export class ExportModalComponent {
  @Output() exportar = new EventEmitter<OpcionesExportacion>();
  @Output() cerrar = new EventEmitter<void>();

  isOpen = false;
  formatoSeleccionado: 'pdf' | 'excel' | null = null;
  tipoContenido: 'datos' | 'graficas' | 'completo' = 'datos';

  open(): void {
    this.isOpen = true;
    this.formatoSeleccionado = null;
    this.tipoContenido = 'datos';
  }

  close(): void {
    this.isOpen = false;
    this.formatoSeleccionado = null;
    this.tipoContenido = 'datos';
    this.cerrar.emit();
  }

  seleccionarFormato(formato: 'pdf' | 'excel'): void {
    this.formatoSeleccionado = formato;
    // Si selecciona Excel, usar contenido completo por defecto
    if (formato === 'excel') {
      this.tipoContenido = 'completo';
    }
  }

  confirmar(): void {
    if (this.formatoSeleccionado) {
      this.exportar.emit({
        formato: this.formatoSeleccionado,
        tipoContenido: this.tipoContenido
      });
      this.close();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    this.close();
  }
}