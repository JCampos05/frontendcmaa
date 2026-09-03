import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TorneoService } from '../../../../services/torneo';
import { AuthService } from '../../../../services/auth';
import { TorneoContextService } from '../../../../services/torneo-context';
import { RondaService } from '../../../../services/ronda';
import { MesaService } from '../../../../services/mesa';
import { ToastNoti } from '../../../../componentes/modales/toast-noti/toast-noti';

import { Torneo } from '../../../../models/torneo';
import { TorneoCategoria } from '../../../../models/torneo-categoria';
import { Ronda, CreateRondaDto } from '../../../../models/ronda';
import { Mesa } from '../../../../models/mesa';

import { ModalCargaEmparejamientoComponent } from '../../../../componentes/principales/carga-emparejamiento/carga-emparejamiento';
import { ModalEmparejamientoManualComponent } from '../../../../componentes/modales/emparejamiento-manual/emparejamiento-manual';
import { ModalResultadoPartidaComponent } from '../../../../componentes/modales/resultado-partida/resultado-partida';
import { ModalConfirmacionComponent } from '../../../../componentes/modales/modal-confirmacion/modal-confirmacion';
import { ModalAdvertenciaEdicionComponent } from '../../../../componentes/modales/advertencia-edicion-mesa/advertencia-edicion-mesa';

import { PageHeaderComponent } from '../../../../componentes/organisms/page-header/page-header';
import { StateMessageComponent } from '../../../../componentes/molecules/state-message/state-message';
import { EmptyStateComponent } from '../../../../componentes/molecules/empty-state/empty-state';
import { ButtonComponent } from '../../../../componentes/atoms/button/button';
import { IconComponent } from '../../../../componentes/atoms/icon/icon';
import { AvisoTorneoSeleccionadoComponent } from '../../../../componentes/molecules/aviso-torneo-seleccionado/aviso-torneo-seleccionado';
import { SelectComponent, SelectOption } from '../../../../componentes/atoms/select/select';
import { BadgeComponent, BadgeStatus } from '../../../../componentes/atoms/badge/badge';
@Component({
  selector: 'app-mesas-torneo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalCargaEmparejamientoComponent,
    ModalEmparejamientoManualComponent,
    ModalResultadoPartidaComponent,
    ModalConfirmacionComponent,
    ModalAdvertenciaEdicionComponent,
    ToastNoti,
    PageHeaderComponent,
    StateMessageComponent,
    EmptyStateComponent,
    ButtonComponent,
    IconComponent,
    SelectComponent,
    BadgeComponent,
    AvisoTorneoSeleccionadoComponent
  ],
  templateUrl: './mesas-torneo.html',
  styleUrls: ['./mesas-torneo.css']
})
export class MesasTorneoComponent implements OnInit {
  @ViewChild(ToastNoti) toast!: ToastNoti;

  torneoActual: Torneo | null = null;
  // Solo para saber si mostrar el aviso "cambia de torneo en Torneo Actual"
  // (no tiene sentido si el admin únicamente tiene uno asignado).
  totalTorneosAsignados = 0;
  categorias: TorneoCategoria[] = [];
  categoriaSeleccionada: TorneoCategoria | null = null;

  rondasDisponibles: Ronda[] = [];
  rondaSeleccionada: number | null = null;
  rondaActualData: Ronda | null = null;

  mesasRonda: Mesa[] = [];
  mesaSeleccionada: Mesa | null = null;

  cargando = false;
  error: string | null = null;
  sinDatos: string | null = null;

  modalCargaArchivoVisible = false;
  modalEmparejamientoVisible = false;
  modalResultadoVisible = false;
  modalConfirmacionVisible = false;
  modalAdvertenciaEdicionVisible = false;

  confirmacionTitulo = '';
  confirmacionMensaje = '';
  confirmacionTextoConfirmar = '';
  confirmacionTipo: 'primary' | 'danger' = 'primary';
  accionConfirmada: (() => void) | null = null;

  constructor(
    private torneoService: TorneoService,
    private authService: AuthService,
    private torneoContext: TorneoContextService,
    private rondaService: RondaService,
    private mesaService: MesaService
  ) { }

  private verificarDatosRonda(): boolean {
    if (!this.rondaActualData?.idRonda) {
      this.mostrarToast('warning', 'Selecciona una ronda', 'Debes seleccionar una ronda antes de continuar');
      return false;
    }
    if (!this.torneoActual?.idTorneo) {
      this.mostrarToast('error', 'Error', 'No se encontró el torneo actual');
      return false;
    }
    if (!this.categoriaSeleccionada?.idCategoria) {
      this.mostrarToast('error', 'Error', 'No se encontró la categoría seleccionada');
      return false;
    }
    return true;
  }

  crearRonda1(): void {
    if (!this.torneoActual?.idTorneo || !this.categoriaSeleccionada?.idTorneoCat) {
      this.mostrarToast('error', 'Error', 'No se pudo obtener la información del torneo o categoría');
      return;
    }

    this.confirmacionTitulo = 'Crear Ronda 1';
    this.confirmacionMensaje = `¿Deseas crear la Ronda 1 para la categoría ${this.categoriaSeleccionada.categoria?.nombre || 'seleccionada'}?`;
    this.confirmacionTextoConfirmar = 'Crear Ronda';
    this.confirmacionTipo = 'primary';
    this.accionConfirmada = () => this.ejecutarCrearRonda1();
    this.modalConfirmacionVisible = true;
  }

  ejecutarCrearRonda1(): void {
    if (!this.torneoActual?.idTorneo || !this.categoriaSeleccionada?.idTorneoCat) return;

    this.cargando = true;

    const rondaDto: CreateRondaDto = {
      idTorneo: this.torneoActual.idTorneo,
      idTorneoCategoria: this.categoriaSeleccionada.idTorneoCat,
      numeroRonda: 1,
      estado: 'pendiente' as 'pendiente' | 'en_curso' | 'finalizada',
      notas: 'Ronda creada automáticamente'
    };

    this.rondaService.createRonda(rondaDto).subscribe({
      next: (ronda) => {
        this.mostrarToast('success', 'Ronda Creada', 'La Ronda 1 ha sido creada exitosamente');

        if (this.torneoActual?.idTorneo && this.categoriaSeleccionada?.idCategoria) {
          this.cargarRondas(this.torneoActual.idTorneo, this.categoriaSeleccionada.idCategoria);
        }
      },
      error: (err) => {
        console.error('Error al crear ronda:', err);
        this.mostrarToast('error', 'Error', 'No se pudo crear la ronda');
        this.cargando = false;
      }
    });
  }


  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;
    this.sinDatos = null;

    // adminTorneo: la asignación ya acota server-side, no hay que filtrar
    // además por activo (un torneo asignado pero finalizado/inactivo sigue
    // siendo válido para consultar sus mesas).
    const esAdminTorneo = this.authService.currentUserValue?.rol === 'adminTorneo';
    this.torneoService.getAll(esAdminTorneo ? undefined : true).subscribe({
      next: (torneos) => {
        this.totalTorneosAsignados = torneos?.length || 0;
        if (torneos && torneos.length > 0) {
          const torneosOrdenados = torneos.sort((a, b) => {
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          });

          // Respetar el torneo elegido en el contexto compartido (p.ej. desde
          // "Torneo Actual" u otra vista hermana) si sigue entre los propios.
          const seleccionActual = this.torneoContext.torneoSeleccionadoValue;
          const seleccionVigente = seleccionActual
            ? torneosOrdenados.find(t => t.idTorneo === seleccionActual.idTorneo)
            : undefined;

          if (seleccionVigente) {
            this.torneoActual = seleccionVigente;
          } else {
            const hoy = new Date();
            const tresDiasDespues = new Date();
            tresDiasDespues.setDate(hoy.getDate() + 3);

            const torneoEnRango = torneosOrdenados.find(t => {
              const fechaTorneo = new Date(t.fecha);
              return fechaTorneo >= hoy && fechaTorneo <= tresDiasDespues;
            });

            this.torneoActual = torneoEnRango || torneosOrdenados[0];
          }

          this.torneoContext.seleccionar(this.torneoActual);

          if (this.torneoActual?.idTorneo) {
            this.cargarCategorias(this.torneoActual.idTorneo);
          }
        } else {
          this.sinDatos = 'No hay torneos activos';
          this.cargando = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar el torneo actual';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }

  cargarCategorias(idTorneo: number): void {
    this.torneoService.getCategoriasByTorneo(idTorneo).subscribe({
      next: (response) => {
        this.categorias = response.categorias || [];
        this.actualizarOpcionesSelect();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar categorías';
        console.error('Error:', err);
        this.cargando = false;
      }
    });
  }
  // --- Helpers de presentación para app-select / app-badge (no alteran la lógica de negocio) ---

  categoriaOptions: SelectOption<TorneoCategoria>[] = [];
  rondaOptions: SelectOption<number>[] = [];

  private actualizarOpcionesSelect(): void {
    this.categoriaOptions = this.categorias.map(cat => ({
      value: cat,
      label: `${cat.categoria?.nombre || 'Categoría'} (${cat.rondas} rondas)`
    }));

    this.rondaOptions = this.rondasDisponibles.map(ronda => {
      let sufijo = '';
      if (ronda.estado === 'finalizada') sufijo = ' - Finalizada';
      else if (ronda.estado === 'en_curso') sufijo = ' - En curso';
      return { value: ronda.numeroRonda, label: `Ronda ${ronda.numeroRonda}${sufijo}` };
    });
  }

  onCategoriaSelect(categoria: TorneoCategoria | null): void {
    this.categoriaSeleccionada = categoria;
    this.onCategoriaChange();
  }

  onRondaSelect(numeroRonda: number | null): void {
    this.rondaSeleccionada = numeroRonda;
    this.onRondaChange();
  }

  getEstadoRondaBadgeStatus(estado: string): BadgeStatus {
    switch (estado) {
      case 'en_curso': return 'in-progress';
      case 'finalizada': return 'finished';
      case 'pendiente':
      default: return 'pending';
    }
  }

  onCategoriaChange(): void {
    this.rondaSeleccionada = null;
    this.rondaActualData = null;
    this.mesasRonda = [];
    this.rondasDisponibles = [];
    this.actualizarOpcionesSelect();

    if (this.categoriaSeleccionada && this.torneoActual?.idTorneo) {
      const idCategoria = this.categoriaSeleccionada.idCategoria;

      if (idCategoria) {
        this.cargarRondas(this.torneoActual.idTorneo, idCategoria);
      } else {
        console.error('No se encontró idCategoria en la categoría seleccionada');
        this.mostrarToast('warning', 'Advertencia', 'Esta categoría no tiene un ID válido');
      }
    }
  }

  cargarRondas(idTorneo: number, idCategoria: number): void {
    this.cargando = true;

    this.rondaService.getRondasByTorneo(idTorneo).subscribe({
      next: (rondas) => {

        const idTorneoCat = this.categoriaSeleccionada?.idTorneoCat;

        if (!idTorneoCat) {
          console.error('No se encontró idTorneoCat en la categoría seleccionada');
          //console.error('Categoría completa:', JSON.stringify(this.categoriaSeleccionada, null, 2));
          this.mostrarToast('error', 'Error', 'La categoría no tiene un identificador válido. Contacta al administrador.');
          this.cargando = false;
          return;
        }

        this.rondasDisponibles = Array.isArray(rondas)
          ? rondas.filter((r: Ronda) => {
            //console.log(`Ronda ${r.numeroRonda}: idTorneoCategoria=${r.idTorneoCategoria} === idTorneoCat=${idTorneoCat}?`, r.idTorneoCategoria === idTorneoCat);
            return r.idTorneoCategoria === idTorneoCat;
          }).sort((a, b) => a.numeroRonda - b.numeroRonda)
          : [];
        this.actualizarOpcionesSelect();

        //console.log('Rondas filtradas:', this.rondasDisponibles);

        if (this.rondasDisponibles.length > 0) {
          // Si había una ronda seleccionada, mantenerla si sigue existiendo
          const rondaActualNumero = this.rondaSeleccionada;

          if (rondaActualNumero) {
            const rondaExistente = this.rondasDisponibles.find(r => r.numeroRonda === rondaActualNumero);
            if (rondaExistente) {
              this.rondaSeleccionada = rondaExistente.numeroRonda;
              this.rondaActualData = rondaExistente;
              this.cargarMesasRonda(rondaExistente.idRonda);
              return;
            }
          }

          // Si no había selección previa, seleccionar la última ronda creada
          const ultimaRonda = this.rondasDisponibles[this.rondasDisponibles.length - 1];
          this.rondaSeleccionada = ultimaRonda.numeroRonda;
          this.rondaActualData = ultimaRonda;
          this.cargarMesasRonda(ultimaRonda.idRonda);
        } else {
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar rondas:', err);
        this.rondasDisponibles = [];
        this.actualizarOpcionesSelect();
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

      if (ronda) {
        this.rondaActualData = ronda;
        this.cargarMesasRonda(ronda.idRonda);
      }
    }
  }

  cargarMesasRonda(idRonda: number): void {
    this.cargando = true;
    this.mesaService.getMesasByRonda(idRonda).subscribe({
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

  getMesasFinalizadas(): number {
    return this.mesasRonda.filter(m => m.estado === 'finalizada').length;
  }

  todasMesasFinalizadas(): boolean {
    return this.mesasRonda.length > 0 &&
      this.mesasRonda.every(m => m.estado === 'finalizada');
  }

  getMesaEstadoClase(estado: string): string {
    return `mesa-${estado}`;
  }

  getEstadoRondaClase(estado: string): string {
    return `status-${estado}`;
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
    if (!this.rondaActualData?.idRonda) return;

    this.rondaService.updateRonda(this.rondaActualData.idRonda, {
      estado: 'en_curso',
      fecha_inicio: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.mostrarToast('success', 'Ronda Iniciada', 'La ronda ha sido iniciada exitosamente');
        if (this.rondaActualData) {
          this.rondaActualData.estado = 'en_curso';
          this.rondaActualData.fecha_inicio = new Date().toISOString();
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
    this.confirmacionMensaje = `¿Estás seguro de finalizar la Ronda ${this.rondaSeleccionada}? Esta acción actualizará las estadísticas del torneo.`;
    this.confirmacionTextoConfirmar = 'Finalizar Ronda';
    this.confirmacionTipo = 'primary';
    this.accionConfirmada = () => this.finalizarRonda();
    this.modalConfirmacionVisible = true;
  }

  finalizarRonda(): void {
    if (!this.rondaActualData?.idRonda) return;

    this.rondaService.updateRonda(this.rondaActualData.idRonda, {
      estado: 'finalizada',
      fecha_fin: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.mostrarToast('success', 'Ronda Finalizada', 'La ronda ha sido finalizada exitosamente');
        if (this.rondaActualData) {
          this.rondaActualData.estado = 'finalizada';
          this.rondaActualData.fecha_fin = new Date().toISOString();
        }

        // Recargar rondas para actualizar la lista
        if (this.torneoActual?.idTorneo && this.categoriaSeleccionada?.idCategoria) {
          this.cargarRondas(this.torneoActual.idTorneo, this.categoriaSeleccionada.idCategoria);
        }
      },
      error: (err) => {
        console.error('Error al finalizar ronda:', err);
        this.mostrarToast('error', 'Error', 'No se pudo finalizar la ronda');
      }
    });
  }

  puedeCrearSiguienteRonda(): boolean {
    if (!this.categoriaSeleccionada || !this.rondaActualData) return false;

    const rondasTotales = this.categoriaSeleccionada.rondas || 0;
    const rondaActual = this.rondaActualData.numeroRonda;

    // Solo puede crear la siguiente si la actual está finalizada y no se alcanzó el máximo
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

    if (siguienteRonda) {
      this.rondaSeleccionada = siguienteRonda.numeroRonda;
      this.rondaActualData = siguienteRonda;
      this.cargarMesasRonda(siguienteRonda.idRonda);
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
    if (!this.torneoActual?.idTorneo || !this.categoriaSeleccionada?.idTorneoCat || !this.rondaActualData) {
      this.mostrarToast('error', 'Error', 'No se pudo obtener la información necesaria');
      return;
    }

    const siguienteNumero = this.rondaActualData.numeroRonda + 1;
    this.cargando = true;

    const rondaDto: CreateRondaDto = {
      idTorneo: this.torneoActual.idTorneo,
      idTorneoCategoria: this.categoriaSeleccionada.idTorneoCat,
      numeroRonda: siguienteNumero,
      estado: 'pendiente' as 'pendiente' | 'en_curso' | 'finalizada',
      notas: `Ronda ${siguienteNumero} creada automáticamente`
    };

    this.rondaService.createRonda(rondaDto).subscribe({
      next: (ronda) => {
        this.mostrarToast('success', 'Ronda Creada', `La Ronda ${siguienteNumero} ha sido creada exitosamente`);

        // Recargar rondas y seleccionar la nueva
        if (this.torneoActual?.idTorneo && this.categoriaSeleccionada?.idCategoria) {
          this.cargarRondas(this.torneoActual.idTorneo, this.categoriaSeleccionada.idCategoria);
        }
      },
      error: (err) => {
        console.error('Error al crear siguiente ronda:', err);
        this.mostrarToast('error', 'Error', 'No se pudo crear la siguiente ronda');
        this.cargando = false;
      }
    });
  }

  abrirModalCargaArchivo(): void {
    if (!this.verificarDatosRonda()) return;
    this.modalCargaArchivoVisible = true;
  }

  cerrarModalCargaArchivo(): void {
    this.modalCargaArchivoVisible = false;
  }

  onCargaExitosa(): void {
    this.cerrarModalCargaArchivo();
    if (this.rondaActualData?.idRonda) {
      this.cargarMesasRonda(this.rondaActualData.idRonda);
    }
    this.mostrarToast('success', 'Emparejamientos Cargados', 'Las mesas han sido creadas exitosamente');
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
    if (this.rondaActualData?.idRonda) {
      this.cargarMesasRonda(this.rondaActualData.idRonda);
    }
    this.mostrarToast('success', 'Mesa Creada', 'La mesa ha sido creada exitosamente');
  }

  abrirModalMesa(mesa: Mesa): void {
    if (this.rondaActualData?.estado !== 'en_curso') {
      this.mostrarToast('warning', 'Ronda no disponible', 'Solo puedes registrar resultados en rondas en curso');
      return;
    }

    if (mesa.estado === 'finalizada') {
      this.mostrarToast('info', 'Mesa finalizada', 'Esta mesa ya tiene un resultado registrado');
      return;
    }

    // Verificar estado de bloqueo en tiempo real antes de abrir
    this.verificarYAbrirModal(mesa);
  }

  abrirModalEdicionMesa(mesa: Mesa, event: Event): void {
    event.stopPropagation();

    if (mesa.estado !== 'finalizada' || !mesa.partida) {
      this.mostrarToast('warning', 'Mesa no disponible', 'Solo puedes editar mesas finalizadas con resultado');
      return;
    }

    // NO establecer mesaSeleccionada aquí todavía
    // PRIMERO verificar disponibilidad
    this.verificarDisponibilidadParaEdicion(mesa);
  }

  private verificarDisponibilidadParaEdicion(mesa: Mesa): void {
    if (!mesa.idMesa) return;

    this.cargando = true;

    this.mesaService.verificarDisponibilidadMesa(mesa.idMesa).subscribe({
      next: (disponibilidad) => {
        this.cargando = false;

        // Si NO está disponible (otro usuario editando)
        if (!disponibilidad.disponible && !disponibilidad.yaFinalizada) {
          const usuario = disponibilidad.usuarioEditando || 'Otro usuario';
          const tiempoRestante = disponibilidad.tiempoRestante
            ? Math.ceil(disponibilidad.tiempoRestante / 60)
            : 0;

          this.mostrarToast(
            'warning',
            'Mesa ocupada',
            `${usuario} está registrando el resultado de esta mesa. Tiempo restante: ${tiempoRestante} min`
          );
          // NO establecer mesaSeleccionada si está bloqueada
          return;
        }

        // SOLO si está disponible, establecer mesaSeleccionada y mostrar modal
        this.mesaSeleccionada = mesa;
        this.modalAdvertenciaEdicionVisible = true;
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al verificar disponibilidad:', err);
        this.mostrarToast('error', 'Error', 'No se pudo verificar el estado de la mesa');
      }
    });
  }

  confirmarEdicionMesa(): void {
    this.modalAdvertenciaEdicionVisible = false;

    if (!this.mesaSeleccionada?.idMesa) return;

    // Abrir el modal de resultado
    // El bloqueo se hará dentro del modal al inicializarse
    this.modalResultadoVisible = true;
  }

  cancelarEdicionMesa(): void {
    this.modalAdvertenciaEdicionVisible = false;
    this.mesaSeleccionada = null;
  }

  private verificarYAbrirModalEdicion(mesa: Mesa): void {
    if (!mesa.idMesa) return;

    this.cargando = true;

    this.mesaService.verificarDisponibilidadMesa(mesa.idMesa).subscribe({
      next: (disponibilidad) => {
        this.cargando = false;

        if (!disponibilidad.disponible && !disponibilidad.yaFinalizada) {
          const usuario = disponibilidad.usuarioEditando || 'Otro usuario';
          const tiempoRestante = disponibilidad.tiempoRestante
            ? Math.ceil(disponibilidad.tiempoRestante / 60)
            : 0;

          this.mostrarToast(
            'warning',
            'Mesa ocupada',
            `${usuario} está registrando el resultado de esta mesa. Tiempo restante: ${tiempoRestante} min`
          );
          return;
        }

        this.mesaSeleccionada = mesa;
        this.modalResultadoVisible = true;
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al verificar disponibilidad:', err);
        this.mostrarToast('error', 'Error', 'No se pudo verificar el estado de la mesa');
      }
    });
  }

  private verificarYAbrirModal(mesa: Mesa): void {
    if (!mesa.idMesa) return;

    // Mostrar indicador de carga
    this.cargando = true;

    this.mesaService.verificarDisponibilidadMesa(mesa.idMesa).subscribe({
      next: (disponibilidad) => {
        this.cargando = false;

        if (!disponibilidad.disponible) {
          // Mesa bloqueada por otro usuario
          const usuario = disponibilidad.usuarioEditando || 'Otro usuario';
          const tiempoRestante = disponibilidad.tiempoRestante
            ? Math.ceil(disponibilidad.tiempoRestante / 60)
            : 0;

          this.mostrarToast(
            'warning',
            'Mesa ocupada',
            `${usuario} está registrando el resultado de esta mesa. Tiempo restante: ${tiempoRestante} min`
          );
          return;
        }

        if (disponibilidad.yaFinalizada) {
          // Mesa fue finalizada mientras tanto
          this.mostrarToast('info', 'Mesa finalizada', 'Esta mesa ya tiene un resultado registrado');
          // Recargar mesas para actualizar la vista
          if (this.rondaActualData?.idRonda) {
            this.cargarMesasRonda(this.rondaActualData.idRonda);
          }
          return;
        }

        // Todo OK - abrir modal
        this.mesaSeleccionada = mesa;
        this.modalResultadoVisible = true;
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al verificar disponibilidad:', err);
        this.mostrarToast('error', 'Error', 'No se pudo verificar el estado de la mesa');
      }
    });
  }

  cerrarModalResultado(): void {
    this.modalResultadoVisible = false;
    this.mesaSeleccionada = null;
  }

  onResultadoGuardado(): void {
    this.cerrarModalResultado();
    if (this.rondaActualData?.idRonda) {
      this.cargarMesasRonda(this.rondaActualData.idRonda);
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

    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();

    if (fechaStr.includes('T')) {
      const [datePart] = fechaStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      const [year, month, day] = fechaStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
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
