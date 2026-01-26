import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InfoLigaService } from '../../../services/infoLiga/info-liga';
import { GrupoLigaService } from '../../../services/grupoLiga/grupo-liga';
import { RondaLigaService } from '../../../services/rondaLiga/ronda-liga';
import { MesaLigaService } from '../../../services/mesaLiga/mesa-liga';
import { ToastNoti } from '../../../componentes/modales/toast-noti/toast-noti';

import { InfoLiga } from '../../../models/infoLiga';
import { GrupoLiga } from '../../../models/grupoLiga';
import { RondaLiga } from '../../../models/rondaLiga';
import { MesaLiga } from '../../../models/mesaLiga';

import { ModalEmparejamientoManualLigaComponent } from '../../../componentes/modales/emparejamiento-manual-liga/emparejamiento-manual-liga';
import { ModalResultadoPartidaLigaComponent } from '../../../componentes/modales/resultado-partida-liga/resultado-partida-liga';
import { ModalConfirmacionComponent } from '../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { ModalAdvertenciaEdicionComponent } from '../../../componentes/modales/advertencia-edicion-mesa/advertencia-edicion-mesa';

@Component({
  selector: 'app-mesas-liga',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalEmparejamientoManualLigaComponent,
    ModalResultadoPartidaLigaComponent,
    ModalConfirmacionComponent,
    ModalAdvertenciaEdicionComponent,
    ToastNoti
  ],
  templateUrl: './mesas-liga.html',
  styleUrls: ['./mesas-liga.css']
})
export class MesasLigaComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  ligaActual: InfoLiga | null = null;
  ligasActivas: InfoLiga[] = [];
  grupos: GrupoLiga[] = [];
  grupoSeleccionado: GrupoLiga | null = null;

  rondasDisponibles: RondaLiga[] = [];
  rondaSeleccionada: number | null = null;
  rondaActualData: RondaLiga | null = null;

  mesasRonda: MesaLiga[] = [];
  mesaSeleccionada: MesaLiga | null = null;

  cargando = false;
  error: string | null = null;

  modalEmparejamientoVisible = false;
  modalResultadoVisible = false;
  modalConfirmacionVisible = false;
  modalAdvertenciaEdicionVisible = false;

  confirmacionTitulo = '';
  confirmacionMensaje = '';
  confirmacionTextoConfirmar = '';
  confirmacionTipo: 'primary' | 'danger' | 'secondary' = 'primary';
  accionConfirmada: (() => void) | null = null;

  constructor(
    private infoLigaService: InfoLigaService,
    private grupoLigaService: GrupoLigaService,
    private rondaLigaService: RondaLigaService,
    private mesaLigaService: MesaLigaService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    this.infoLigaService.getAll({ activo: 1 }).subscribe({
      next: (ligas) => {
        if (ligas && ligas.length > 0) {
          this.ligasActivas = ligas.sort((a, b) => {
            return new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime();
          });

          this.ligaActual = this.ligasActivas[0];

          if (this.ligaActual?.idLiga) {
            this.cargarGrupos(this.ligaActual.idLiga);
          }
        } else {
          this.error = 'No hay ligas activas';
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar las ligas activas';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  cargarGrupos(idLiga: number): void {
    this.grupoLigaService.getByLiga(idLiga).subscribe({
      next: (grupos) => {
        this.grupos = grupos.filter(g => g.activo);
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar grupos';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  onLigaChange(): void {
    this.grupoSeleccionado = null;
    this.rondaSeleccionada = null;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.grupos = [];
    this.rondasDisponibles = [];

    if (this.ligaActual?.idLiga) {
      this.cargarGrupos(this.ligaActual.idLiga);
    }
  }

  onGrupoChange(): void {
    this.rondaSeleccionada = null;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.rondasDisponibles = [];

    if (this.grupoSeleccionado?.idGrupoLiga && this.ligaActual?.idLiga) {
      this.cargarRondas(this.ligaActual.idLiga, this.grupoSeleccionado.idGrupoLiga);
    }
  }

  cargarRondas(idLiga: number, idGrupoLiga: number): void {
    this.cargando = true;

    this.rondaLigaService.getByGrupo(idGrupoLiga).subscribe({
      next: (rondas) => {
        this.rondasDisponibles = Array.isArray(rondas)
          ? rondas.sort((a, b) => a.numeroRonda - b.numeroRonda)
          : [];

        if (this.rondasDisponibles.length > 0) {
          const rondaActualNumero = this.rondaSeleccionada;

          if (rondaActualNumero) {
            const rondaExistente = this.rondasDisponibles.find(r => r.numeroRonda === rondaActualNumero);
            if (rondaExistente) {
              this.rondaSeleccionada = rondaExistente.numeroRonda;
              this.rondaActualData = rondaExistente;
              if (rondaExistente.idRondaLiga) {
                this.cargarMesasRonda(rondaExistente.idRondaLiga);
              }
              return;
            }
          }

          const ultimaRonda = this.rondasDisponibles[this.rondasDisponibles.length - 1];
          this.rondaSeleccionada = ultimaRonda.numeroRonda;
          this.rondaActualData = ultimaRonda;
          if (ultimaRonda.idRondaLiga) {
            this.cargarMesasRonda(ultimaRonda.idRondaLiga);
          }
        } else {
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar rondas:', err);
        this.rondasDisponibles = [];
        this.cargando = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las rondas');
      }
    });
  }

  onRondaChange(): void {
    if (this.rondaSeleccionada) {
      const ronda = this.rondasDisponibles.find(
        r => r.numeroRonda === this.rondaSeleccionada
      );

      if (ronda?.idRondaLiga) {
        this.rondaActualData = ronda;
        this.cargarMesasRonda(ronda.idRondaLiga);
      }
    }
  }

  cargarMesasRonda(idRondaLiga: number): void {
    this.cargando = true;
    this.mesaLigaService.getByRonda(idRondaLiga).subscribe({
      next: (mesas) => {
        this.mesasRonda = Array.isArray(mesas) ? mesas : [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar mesas:', err);
        this.mesasRonda = [];
        this.cargando = false;
        this.mostrarToast('error', 'Error', 'No se pudieron cargar las mesas');
      }
    });
  }

  crearRonda1(): void {
    if (!this.ligaActual?.idLiga || !this.grupoSeleccionado?.idGrupoLiga) {
      this.mostrarToast('error', 'Error', 'No se pudo obtener la información de la liga o grupo');
      return;
    }

    this.confirmacionTitulo = 'Crear Ronda 1';
    this.confirmacionMensaje = `¿Deseas crear la Ronda 1 para el grupo ${this.grupoSeleccionado.nombre}?`;
    this.confirmacionTextoConfirmar = 'Crear Ronda';
    this.confirmacionTipo = 'primary';
    this.accionConfirmada = () => this.ejecutarCrearRonda1();
    this.modalConfirmacionVisible = true;
  }

  ejecutarCrearRonda1(): void {
    if (!this.ligaActual?.idLiga || !this.grupoSeleccionado?.idGrupoLiga) return;

    this.cargando = true;

    const rondaDto = {
      idLiga: this.ligaActual.idLiga,
      idGrupoLiga: this.grupoSeleccionado.idGrupoLiga,
      numeroRonda: 1,
      estado: 'planificada' as const
    };

    this.rondaLigaService.create(rondaDto).subscribe({
      next: () => {
        this.mostrarToast('success', 'Ronda Creada', 'La Ronda 1 ha sido creada exitosamente');

        if (this.ligaActual?.idLiga && this.grupoSeleccionado?.idGrupoLiga) {
          this.cargarRondas(this.ligaActual.idLiga, this.grupoSeleccionado.idGrupoLiga);
        }
      },
      error: (err) => {
        console.error('Error al crear ronda:', err);
        this.mostrarToast('error', 'Error', 'No se pudo crear la ronda');
        this.cargando = false;
      }
    });
  }

  getMesasFinalizadas(): number {
    return this.mesasRonda.filter(m => m.estado === 'finalizada').length;
  }

  todasMesasFinalizadas(): boolean {
    return this.mesasRonda.length > 0 &&
      this.mesasRonda.every(m => m.estado === 'finalizada');
  }

  getMesaEstadoClase(estado?: string): string {
    return `mesa-${estado || 'pendiente'}`;
  }

  getEstadoRondaClase(estado?: string): string {
    return `status-${estado || 'planificada'}`;
  }

  getTipoFinalizacionTexto(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'jaquemate': 'Jaque Mate',
      'tiempo': 'Por Tiempo',
      'rendicion': 'Rendición',
      'ilegales': 'Jugadas Ilegales',
      'incomparecencia': 'Incomparecencia',
      'empate_comun': 'Empate Común',
      'empate_material': 'Empate por Material',
      'empate_50_movidas': 'Empate 50 Movidas',
      'empate_triple_repeticion': 'Triple Repetición',
      'otro': 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  confirmarInicioRonda(): void {
    this.confirmacionTitulo = 'Iniciar Ronda';
    this.confirmacionMensaje = `¿Estás seguro de iniciar la Ronda ${this.rondaSeleccionada}? Una vez iniciada, se podrán registrar los resultados de las partidas.`;
    this.confirmacionTextoConfirmar = 'Iniciar Ronda';
    this.confirmacionTipo = 'primary';
    this.accionConfirmada = () => this.iniciarRonda();
    this.modalConfirmacionVisible = true;
  }

  iniciarRonda(): void {
    if (!this.rondaActualData?.idRondaLiga) return;

    this.rondaLigaService.update(this.rondaActualData.idRondaLiga, {
      estado: 'en_curso',
      fecha_inicio: new Date()
    }).subscribe({
      next: () => {
        this.mostrarToast('success', 'Ronda Iniciada', 'La ronda ha sido iniciada exitosamente');
        if (this.rondaActualData) {
          this.rondaActualData.estado = 'en_curso';
          this.rondaActualData.fecha_inicio = new Date();
        }
      },
      error: (err) => {
        console.error('Error al iniciar ronda:', err);
        this.mostrarToast('error', 'Error', 'No se pudo iniciar la ronda');
      }
    });
  }

  confirmarFinalizarRonda(): void {
    this.confirmacionTitulo = 'Finalizar Ronda';
    this.confirmacionMensaje = `¿Estás seguro de finalizar la Ronda ${this.rondaSeleccionada}? Esta acción actualizará las estadísticas del grupo.`;
    this.confirmacionTextoConfirmar = 'Finalizar Ronda';
    this.confirmacionTipo = 'primary';
    this.accionConfirmada = () => this.finalizarRonda();
    this.modalConfirmacionVisible = true;
  }

  finalizarRonda(): void {
    if (!this.rondaActualData?.idRondaLiga) return;

    this.rondaLigaService.update(this.rondaActualData.idRondaLiga, {
      estado: 'finalizada',
      fecha_fin: new Date()
    }).subscribe({
      next: () => {
        this.mostrarToast('success', 'Ronda Finalizada', 'La ronda ha sido finalizada exitosamente');
        if (this.rondaActualData) {
          this.rondaActualData.estado = 'finalizada';
          this.rondaActualData.fecha_fin = new Date();
        }

        if (this.ligaActual?.idLiga && this.grupoSeleccionado?.idGrupoLiga) {
          this.cargarRondas(this.ligaActual.idLiga, this.grupoSeleccionado.idGrupoLiga);
        }
      },
      error: (err) => {
        console.error('Error al finalizar ronda:', err);
        this.mostrarToast('error', 'Error', 'No se pudo finalizar la ronda');
      }
    });
  }

  puedeCrearSiguienteRonda(): boolean {
    if (!this.grupoSeleccionado || !this.rondaActualData) return false;

    const rondasTotales = this.grupoSeleccionado.rondas || 5;
    const rondaActual = this.rondaActualData.numeroRonda;

    return this.rondaActualData.estado === 'finalizada' && rondaActual < rondasTotales;
  }

  siguienteRondaYaExiste(): boolean {
    if (!this.rondaActualData) return false;

    const siguienteNumero = this.rondaActualData.numeroRonda + 1;
    return this.rondasDisponibles.some(r => r.numeroRonda === siguienteNumero);
  }

  irASiguienteRonda(): void {
    if (!this.rondaActualData) return;

    const siguienteNumero = this.rondaActualData.numeroRonda + 1;
    const siguienteRonda = this.rondasDisponibles.find(r => r.numeroRonda === siguienteNumero);

    if (siguienteRonda?.idRondaLiga) {
      this.rondaSeleccionada = siguienteRonda.numeroRonda;
      this.rondaActualData = siguienteRonda;
      this.cargarMesasRonda(siguienteRonda.idRondaLiga);
      this.mostrarToast('info', 'Ronda Seleccionada', `Ahora estás viendo la Ronda ${siguienteNumero}`);
    }
  }

  confirmarCrearSiguienteRonda(): void {
    if (!this.rondaActualData) return;

    const siguienteNumero = this.rondaActualData.numeroRonda + 1;

    this.confirmacionTitulo = 'Crear Siguiente Ronda';
    this.confirmacionMensaje = `¿Deseas crear la Ronda ${siguienteNumero}? Podrás configurar los emparejamientos después.`;
    this.confirmacionTextoConfirmar = 'Crear Ronda';
    this.confirmacionTipo = 'primary';
    this.accionConfirmada = () => this.crearSiguienteRonda();
    this.modalConfirmacionVisible = true;
  }

  crearSiguienteRonda(): void {
    if (!this.ligaActual?.idLiga || !this.grupoSeleccionado?.idGrupoLiga || !this.rondaActualData) {
      this.mostrarToast('error', 'Error', 'No se pudo obtener la información necesaria');
      return;
    }

    const siguienteNumero = this.rondaActualData.numeroRonda + 1;
    this.cargando = true;

    const rondaDto = {
      idLiga: this.ligaActual.idLiga,
      idGrupoLiga: this.grupoSeleccionado.idGrupoLiga,
      numeroRonda: siguienteNumero,
      estado: 'planificada' as const
    };

    this.rondaLigaService.create(rondaDto).subscribe({
      next: () => {
        this.mostrarToast('success', 'Ronda Creada', `La Ronda ${siguienteNumero} ha sido creada exitosamente`);

        if (this.ligaActual?.idLiga && this.grupoSeleccionado?.idGrupoLiga) {
          this.cargarRondas(this.ligaActual.idLiga, this.grupoSeleccionado.idGrupoLiga);
        }
      },
      error: (err) => {
        console.error('Error al crear siguiente ronda:', err);
        this.mostrarToast('error', 'Error', 'No se pudo crear la siguiente ronda');
        this.cargando = false;
      }
    });
  }

  abrirModalEmparejamientoManual(): void {
    if (!this.verificarDatosRonda()) return;
    this.modalEmparejamientoVisible = true;
  }

  cerrarModalEmparejamiento(): void {
    this.modalEmparejamientoVisible = false;
  }

  onEmparejamientoCreado(): void {
    this.cerrarModalEmparejamiento();
    if (this.rondaActualData?.idRondaLiga) {
      this.cargarMesasRonda(this.rondaActualData.idRondaLiga);
    }
    this.mostrarToast('success', 'Mesa Creada', 'La mesa ha sido creada exitosamente');
  }

  private verificarDatosRonda(): boolean {
    if (!this.rondaActualData?.idRondaLiga) {
      this.mostrarToast('warning', 'Selecciona una ronda', 'Debes seleccionar una ronda antes de continuar');
      return false;
    }
    if (!this.ligaActual?.idLiga) {
      this.mostrarToast('error', 'Error', 'No se encontró la liga actual');
      return false;
    }
    if (!this.grupoSeleccionado?.idGrupoLiga) {
      this.mostrarToast('error', 'Error', 'No se encontró el grupo seleccionado');
      return false;
    }
    return true;
  }

  abrirModalMesa(mesa: MesaLiga): void {
    if (this.rondaActualData?.estado !== 'en_curso') {
      this.mostrarToast('warning', 'Ronda no disponible', 'Solo puedes registrar resultados en rondas en curso');
      return;
    }

    if (mesa.estado === 'finalizada') {
      this.mostrarToast('info', 'Mesa finalizada', 'Esta mesa ya tiene un resultado registrado');
      return;
    }

    this.mesaSeleccionada = mesa;
    this.modalResultadoVisible = true;
  }

  abrirModalEdicionMesa(mesa: MesaLiga, event: Event): void {
    event.stopPropagation();

    if (mesa.estado !== 'finalizada' || !mesa.partida) {
      this.mostrarToast('warning', 'Mesa no disponible', 'Solo puedes editar mesas finalizadas con resultado');
      return;
    }

    this.mesaSeleccionada = mesa;
    this.modalAdvertenciaEdicionVisible = true;
  }

  confirmarEdicionMesa(): void {
    this.modalAdvertenciaEdicionVisible = false;
    this.modalResultadoVisible = true;
  }

  cancelarEdicionMesa(): void {
    this.modalAdvertenciaEdicionVisible = false;
    this.mesaSeleccionada = null;
  }

  cerrarModalResultado(): void {
    this.modalResultadoVisible = false;
    this.mesaSeleccionada = null;
  }

  onResultadoGuardado(): void {
    this.cerrarModalResultado();
    if (this.rondaActualData?.idRondaLiga) {
      this.cargarMesasRonda(this.rondaActualData.idRondaLiga);
    }
    this.mostrarToast('success', 'Resultado Guardado', 'El resultado ha sido registrado exitosamente');
  }

  ejecutarAccionConfirmada(): void {
    if (this.accionConfirmada) {
      this.accionConfirmada();
    }
    this.cerrarModalConfirmacion();
  }

  cerrarModalConfirmacion(): void {
    this.modalConfirmacionVisible = false;
    this.accionConfirmada = null;
  }

  mostrarToast(tipo: 'success' | 'error' | 'warning' | 'info', titulo: string, mensaje?: string): void {
    if (this.toast) {
      this.toast.show(tipo, titulo, mensaje);
    }
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatearFechaHora(fecha: Date | string | undefined): string {
    if (!fecha) return '-';

    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}