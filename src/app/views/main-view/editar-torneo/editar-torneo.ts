import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AbstractControl, ValidationErrors } from '@angular/forms';

import { TorneoService } from '../../../services/torneo/torneo';
import { TorneoCategoriaService } from '../../../services/torneo-categoria/torneo-categoria';
import { CategoriaService } from '../../../services/categoria/categoria';
import { RitmoJuegoService } from '../../../services/ritmo-juego/ritmo-juego';
import { SistemaCompetenciaService } from '../../../services/sistema-competencia/sistema-competencia';
import { SistemaDesempateService } from '../../../services/sistema-desempates/sistema-desempates';

import { Categoria } from '../../../models/categoria';
import { RitmoJuego } from '../../../models/ritmo-juego';
import { SistemaCompetencia } from '../../../models/sistema-competencia';
import { SistemaDesempate } from '../../../models/sistema-desempates';
import { Torneo } from '../../../models/torneo';
import { TorneoCategoria } from '../../../models/torneo-categoria';

@Component({
  selector: 'app-editar-torneo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-torneo.html',
  styleUrls: ['./editar-torneo.css']
})
export class EditarTorneoComponent implements OnInit {
  torneoForm: FormGroup;
  idTorneo: number = 0;
  torneoOriginal: any = null;

  // Catálogos
  categorias: Categoria[] = [];
  ritmosJuego: RitmoJuego[] = [];
  sistemasCompetencia: SistemaCompetencia[] = [];
  sistemasDesempate: SistemaDesempate[] = [];

  // UI State
  categoriasSeleccionadas: number[] = [];
  categoriasExpandidas: number[] = [];
  seccionesAbiertas = {
    informacionGeneral: true,
    categorias: true,
    configuracionAdicional: true,
    notas: true
  };

  loading = false;
  loadingData = true;
  error: string | null = null;
  mostrarModalCambios = false;
  confirmacionGuardado = false; // Nueva variable para controlar el flujo de guardado
  desempatesGlobales: number[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private torneoService: TorneoService,
    private torneoCategoriaService: TorneoCategoriaService,
    private categoriaService: CategoriaService,
    private ritmoJuegoService: RitmoJuegoService,
    private sistemaCompetenciaService: SistemaCompetenciaService,
    private sistemaDesempateService: SistemaDesempateService
  ) {
    this.torneoForm = this.fb.group({
      nombre: ['', Validators.required],
      lugar: ['', Validators.required],
      direccion: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      cierreInscripciones: ['', Validators.required],
      tiempoEspera: [10, [Validators.min(0)]],
      permitirByePrimeraRonda: [true],
      notas: [''],
      configuracionCategorias: this.fb.array([])
    }, { validators: this.cierreAntesDelTorneoValidator.bind(this) });
  }

  ngOnInit(): void {
    this.idTorneo = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.idTorneo) {
      this.router.navigate(['/main-view/torneos']);
      return;
    }
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loadingData = true;
    try {
      // Cargar todo en paralelo usando forkJoin
      const resultado = await forkJoin({
        categorias: this.categoriaService.getAll(),
        ritmosJuego: this.ritmoJuegoService.getAll(true),
        sistemasCompetencia: this.sistemaCompetenciaService.getAll(true),
        sistemasDesempate: this.sistemaDesempateService.getAll(true),
        torneo: this.torneoService.getById(this.idTorneo)
      }).toPromise();

      if (!resultado) {
        throw new Error('Error al cargar datos');
      }

      // Asignar catálogos
      this.categorias = resultado.categorias || [];
      this.ritmosJuego = resultado.ritmosJuego || [];
      this.sistemasCompetencia = resultado.sistemasCompetencia || [];
      this.sistemasDesempate = resultado.sistemasDesempate || [];

      const torneo: any = resultado.torneo;
      if (!torneo) {
        throw new Error('Torneo no encontrado');
      }

      this.torneoOriginal = JSON.parse(JSON.stringify(torneo));
      this.cargarFormulario(torneo);
    } catch (err: any) {
      this.error = err.error?.message || 'Error al cargar el torneo';
      console.error('Error:', err);
    } finally {
      this.loadingData = false;
    }
  }

  cargarFormulario(torneo: any): void {
    // Cargar información general
    const fechaISO = typeof torneo.fecha === 'string' ? torneo.fecha.split('T')[0] : '';

    // Manejar cierre_inscripciones (puede venir como snake_case del backend)
    const cierreRaw = torneo.cierreInscripciones || torneo.cierre_inscripciones;
    let cierreISO = '';
    if (cierreRaw && typeof cierreRaw === 'string') {
      // Si tiene formato ISO completo, convertir a datetime-local
      cierreISO = cierreRaw.substring(0, 16);
    }

    this.torneoForm.patchValue({
      nombre: torneo.nombre || '',
      lugar: torneo.lugar || '',
      direccion: torneo.direccion || '',
      fecha: fechaISO,
      hora: torneo.hora || '',
      cierreInscripciones: cierreISO,
      tiempoEspera: 10,
      permitirByePrimeraRonda: true,
      notas: torneo.notas || ''
    });

    // Cargar categorías - puede venir como torneoCategoria o torneo_categorias
    const categoriasData = (torneo as any).torneoCategoria || (torneo as any).torneo_categorias || [];

    if (categoriasData && Array.isArray(categoriasData) && categoriasData.length > 0) {
      // Obtener desempates globales del primer torneo-categoria
      const primeraCategoria = categoriasData[0];
      if (primeraCategoria?.desempates && Array.isArray(primeraCategoria.desempates)) {
        this.desempatesGlobales = primeraCategoria.desempates
          .map((nombre: string) => this.sistemasDesempate.find(s => s.nombre === nombre)?.idDesempate)
          .filter((id: number | undefined): id is number => id !== undefined);
      }

      categoriasData.forEach((tc: any) => {
        if (tc?.idCategoria) {
          this.categoriasSeleccionadas.push(tc.idCategoria);
          this.categoriasExpandidas.push(tc.idCategoria);
          this.agregarConfiguracionCategoriaConDatos(tc);
        }
      });
    }

    // IMPORTANTE: Marcar el formulario como pristine después de cargar todos los datos
    // Esto permite que Angular detecte los cambios del usuario
    setTimeout(() => {
      this.torneoForm.markAsPristine();
      this.torneoForm.markAsUntouched();
    }, 100);
  }

  agregarConfiguracionCategoriaConDatos(tc: any): void {
    // Parsear premios
    const premiosArray: any[] = [];
    if (tc?.premios && typeof tc.premios === 'object') {
      Object.keys(tc.premios).forEach(key => {
        const valor = tc.premios[key];
        const partes = valor.split(' - ');
        premiosArray.push(this.crearPremio(partes[1] || `Lugar ${key}`, partes[0] || '0'));
      });
    }

    if (premiosArray.length === 0) {
      premiosArray.push(
        this.crearPremio('Primer Lugar', '0'),
        this.crearPremio('Segundo Lugar', '0'),
        this.crearPremio('Tercer Lugar', '0')
      );
    }

    // Manejar tanto camelCase como snake_case
    const ritmoJuego = tc?.ritmoJuego || tc?.ritmo_juego || '';
    const sistemaCompetencia = tc?.sistemaCompetencia || tc?.sistema_competencia || '';

    // Crear configuración
    const config = this.fb.group({
      idCategoria: [tc?.idCategoria],
      rondas: [tc?.rondas || 5, [Validators.required, Validators.min(1)]],
      ritmoJuego: [ritmoJuego, Validators.required],
      sistemaCompetencia: [sistemaCompetencia, Validators.required],
      calendario: this.fb.array([]),
      premios: this.fb.array(premiosArray),
      desempates: [[...this.desempatesGlobales]]
    });

    // Cargar calendario
    const calendarioArray = config.get('calendario') as FormArray;
    if (tc?.calendario && Array.isArray(tc.calendario)) {
      tc.calendario.forEach((ronda: any) => {
        // Convertir fecha ISO a formato datetime-local si es necesario
        let fechaFormateada = ronda?.fecha || '';
        if (fechaFormateada && typeof fechaFormateada === 'string') {
          // Eliminar la 'Z' y los milisegundos si existen
          fechaFormateada = fechaFormateada.replace('Z', '').substring(0, 16);
        }

        calendarioArray.push(this.fb.group({
          numero: [ronda?.numero],
          fecha: [fechaFormateada]
        }));
      });
    } else {
      // Crear calendario vacío basado en número de rondas
      const numRondas = tc?.rondas || 5;
      for (let i = 0; i < numRondas; i++) {
        calendarioArray.push(this.crearRonda(i + 1));
      }
    }

    this.configuracionCategorias.push(config);

    // Listener para actualizar calendario cuando cambien las rondas
    config.get('rondas')?.valueChanges.subscribe(rondas => {
      if (typeof rondas === 'number' && rondas > 0) {
        this.actualizarCalendario(config, rondas);
      }
    });
  }

  get configuracionCategorias(): FormArray {
    return this.torneoForm.get('configuracionCategorias') as FormArray;
  }

  toggleCategoria(idCategoria: number): void {
    const index = this.categoriasSeleccionadas.indexOf(idCategoria);

    if (index > -1) {
      this.categoriasSeleccionadas.splice(index, 1);
      const configIndex = this.configuracionCategorias.controls.findIndex(
        c => c.get('idCategoria')?.value === idCategoria
      );
      if (configIndex > -1) {
        this.configuracionCategorias.removeAt(configIndex);
      }
      const expandedIndex = this.categoriasExpandidas.indexOf(idCategoria);
      if (expandedIndex > -1) {
        this.categoriasExpandidas.splice(expandedIndex, 1);
      }
    } else {
      this.categoriasSeleccionadas.push(idCategoria);
      this.agregarConfiguracionCategoria(idCategoria);
      this.categoriasExpandidas.push(idCategoria);
    }
  }

  isCategoriaSeleccionada(idCategoria: number): boolean {
    return this.categoriasSeleccionadas.includes(idCategoria);
  }

  isCategoriaExpandida(idCategoria: number): boolean {
    return this.categoriasExpandidas.includes(idCategoria);
  }

  toggleCategoriaExpandida(idCategoria: number): void {
    const index = this.categoriasExpandidas.indexOf(idCategoria);
    if (index > -1) {
      this.categoriasExpandidas.splice(index, 1);
    } else {
      this.categoriasExpandidas.push(idCategoria);
    }
  }

  agregarConfiguracionCategoria(idCategoria: number): void {
    const config = this.fb.group({
      idCategoria: [idCategoria],
      rondas: [5, [Validators.required, Validators.min(1)]],
      ritmoJuego: ['', Validators.required],
      sistemaCompetencia: ['', Validators.required],
      calendario: this.fb.array([]),
      premios: this.fb.array([
        this.crearPremio('Primer Lugar', '0'),
        this.crearPremio('Segundo Lugar', '0'),
        this.crearPremio('Tercer Lugar', '0')
      ]),
      desempates: [[...this.desempatesGlobales]]
    });

    const numRondas = config.get('rondas')?.value || 5;
    this.actualizarCalendario(config, numRondas);

    this.configuracionCategorias.push(config);

    config.get('rondas')?.valueChanges.subscribe(rondas => {
      if (typeof rondas === 'number' && rondas > 0) {
        this.actualizarCalendario(config, rondas);
      }
    });
  }

  crearPremio(descripcion: string, monto: string | number): FormGroup {
    return this.fb.group({
      descripcion: [descripcion],
      monto: [monto, [Validators.min(0)]]
    });
  }

  actualizarCalendario(config: FormGroup, numRondas: number): void {
    const calendario = config.get('calendario') as FormArray;
    const currentLength = calendario.length;

    if (numRondas > currentLength) {
      for (let i = currentLength; i < numRondas; i++) {
        calendario.push(this.crearRonda(i + 1));
      }
    } else if (numRondas < currentLength) {
      for (let i = currentLength - 1; i >= numRondas; i--) {
        calendario.removeAt(i);
      }
    }
  }

  crearRonda(numero: number): FormGroup {
    return this.fb.group({
      numero: [numero],
      fecha: ['']
    });
  }

  getCalendario(configIndex: number): FormArray {
    return this.configuracionCategorias.at(configIndex).get('calendario') as FormArray;
  }

  getPremios(configIndex: number): FormArray {
    return this.configuracionCategorias.at(configIndex).get('premios') as FormArray;
  }

  agregarPremio(configIndex: number): void {
    const premios = this.getPremios(configIndex);
    const nextLugar = premios.length + 1;
    let descripcion = '';

    if (nextLugar === 4) {
      descripcion = 'Cuarto Lugar';
    } else if (nextLugar === 5) {
      descripcion = 'Quinto Lugar';
    } else {
      descripcion = `Lugar ${nextLugar}`;
    }

    premios.push(this.crearPremio(descripcion, '0'));
  }

  eliminarPremio(configIndex: number, premioIndex: number): void {
    const premios = this.getPremios(configIndex);
    if (premios.length > 1) {
      premios.removeAt(premioIndex);
    }
  }

  toggleDesempate(configIndex: number | null, sistemaId: number): void {
    if (configIndex === null) {
      const index = this.desempatesGlobales.indexOf(sistemaId);
      if (index > -1) {
        this.desempatesGlobales.splice(index, 1);
      } else {
        this.desempatesGlobales.push(sistemaId);
      }

      this.configuracionCategorias.controls.forEach(config => {
        config.patchValue({ desempates: [...this.desempatesGlobales] });
      });
    } else {
      const config = this.configuracionCategorias.at(configIndex);
      const desempates = config.get('desempates')?.value || [];
      const index = desempates.indexOf(sistemaId);

      if (index > -1) {
        desempates.splice(index, 1);
      } else {
        desempates.push(sistemaId);
      }

      config.patchValue({ desempates });
    }
  }

  isDesempateSeleccionado(configIndex: number | null, sistemaId: number): boolean {
    if (configIndex === null) {
      return this.desempatesGlobales.includes(sistemaId);
    }

    const config = this.configuracionCategorias.at(configIndex);
    const desempates = config.get('desempates')?.value || [];
    return desempates.includes(sistemaId);
  }

  getPrioridadDesempate(configIndex: number | null, sistemaId: number): number {
    if (configIndex === null) {
      const index = this.desempatesGlobales.indexOf(sistemaId);
      return index > -1 ? index + 1 : 0;
    }

    const config = this.configuracionCategorias.at(configIndex);
    const desempates = config.get('desempates')?.value || [];
    const index = desempates.indexOf(sistemaId);
    return index > -1 ? index + 1 : 0;
  }

  getNombreCategoria(idCategoria: number): string {
    return this.categorias.find(c => c.idCategoria === idCategoria)?.nombre || '';
  }

  toggleSeccion(seccion: keyof typeof this.seccionesAbiertas): void {
    this.seccionesAbiertas[seccion] = !this.seccionesAbiertas[seccion];
  }

  hayFormularioSucio(): boolean {
    // Primero verificar con el flag dirty de Angular
    if (this.torneoForm.dirty) {
      return true;
    }

    // Si dirty es false, comparar valores actuales con originales
    if (!this.torneoOriginal) {
      return false;
    }

    const valoresActuales = JSON.stringify(this.torneoForm.value);
    const valoresOriginalesForm = this.construirFormularioOriginal();
    const valoresOriginales = JSON.stringify(valoresOriginalesForm);

    return valoresActuales !== valoresOriginales;
  }

  construirFormularioOriginal(): any {
    if (!this.torneoOriginal) return {};

    const fechaISO = typeof this.torneoOriginal.fecha === 'string'
      ? this.torneoOriginal.fecha.split('T')[0]
      : '';

    const cierreRaw = this.torneoOriginal.cierreInscripciones || this.torneoOriginal.cierre_inscripciones;
    let cierreISO = '';
    if (cierreRaw && typeof cierreRaw === 'string') {
      cierreISO = cierreRaw.substring(0, 16);
    }

    return {
      nombre: this.torneoOriginal.nombre || '',
      lugar: this.torneoOriginal.lugar || '',
      direccion: this.torneoOriginal.direccion || '',
      fecha: fechaISO,
      hora: this.torneoOriginal.hora || '',
      cierreInscripciones: cierreISO,
      tiempoEspera: 10,
      permitirByePrimeraRonda: true,
      notas: this.torneoOriginal.notas || '',
      configuracionCategorias: this.torneoForm.value.configuracionCategorias
    };
  }

  cancelar(): void {
    const esSucio = this.hayFormularioSucio();

    if (esSucio) {
      this.mostrarModalCambios = true;
    } else {
      this.router.navigate(['/main-view/torneos']);
    }
  }

  cancelarSalir(): void {
    this.mostrarModalCambios = false;
  }

  confirmarSalir(): void {
    this.mostrarModalCambios = false;
    this.router.navigate(['/main-view/torneos']);
  }

  async guardarYSalir(): Promise<void> {
    this.mostrarModalCambios = false;
    this.confirmacionGuardado = true; // Marcar que ya se confirmó
    await this.guardarTorneo();
  }

  async guardarTorneo(): Promise<void> {
    if (this.torneoForm.invalid || this.categoriasSeleccionadas.length === 0) {
      this.error = 'Por favor complete todos los campos requeridos y seleccione al menos una categoría';
      return;
    }

    if (this.desempatesGlobales.length < 2) {
      this.error = 'Debe seleccionar al menos 2 sistemas de desempate';
      return;
    }

    // Si hay cambios, mostrar modal de confirmación
    const esSucio = this.hayFormularioSucio();

    if (esSucio && !this.confirmacionGuardado) {
      this.mostrarModalCambios = true;
      return;
    }

    // Proceder con el guardado
    this.loading = true;
    this.error = null;

    try {
      const formValue = this.torneoForm.value;

      // Actualizar torneo principal
      const torneoData = {
        nombre: formValue.nombre,
        lugar: formValue.lugar,
        direccion: formValue.direccion,
        fecha: formValue.fecha,
        hora: formValue.hora,
        cierre_inscripciones: formValue.cierreInscripciones,
        notas: formValue.notas || null,
        rondas: Math.max(...formValue.configuracionCategorias.map((c: any) => c.rondas)),
        categorias: this.categoriasSeleccionadas.map(id => this.getNombreCategoria(id)),
        activo: true
      };

      await this.torneoService.update(this.idTorneo, torneoData).toPromise();

      // Actualizar configuraciones de categorías
      for (const config of formValue.configuracionCategorias) {
        const premiosObj: any = {};
        config.premios.forEach((p: any, idx: number) => {
          const descripcion = p.descripcion || `Lugar ${idx + 1}`;
          const monto = p.monto || '0';
          premiosObj[idx + 1] = `${monto} - ${descripcion}`;
        });

        const categoriaData = {
          idTorneo: this.idTorneo,
          idCategoria: config.idCategoria,
          rondas: config.rondas,
          ritmo_juego: config.ritmoJuego || null,
          sistema_competencia: config.sistemaCompetencia || null,
          calendario: config.calendario.map((ronda: any) => ({
            numero: ronda.numero,
            fecha: ronda.fecha || null
          })),
          premios: premiosObj,
          desempates: config.desempates.map((id: number) =>
            this.sistemasDesempate.find(s => s.idDesempate === id)?.nombre || ''
          ),
          activo: true
        };

        await this.torneoCategoriaService.upsert(categoriaData).toPromise();
      }

      this.router.navigate(['/main-view/torneos']);
    } catch (err: any) {
      this.error = err.error?.message || 'Error al actualizar el torneo';
      //console.error('Error completo:', err);
    } finally {
      this.loading = false;
      this.confirmacionGuardado = false;
    }
  }

  private cierreAntesDelTorneoValidator(formGroup: AbstractControl): ValidationErrors | null {
    const fechaControl = formGroup.get('fecha');
    const horaControl = formGroup.get('hora');
    const cierreControl = formGroup.get('cierreInscripciones');

    if (!fechaControl || !horaControl || !cierreControl) {
      return null;
    }
    const fecha = fechaControl.value;
    const hora = horaControl.value;
    const cierre = cierreControl.value;
    if (!fecha || !hora || !cierre) {
      return null;
    }
    // Combinar fecha y hora del torneo
    const fechaTorneo = new Date(`${fecha}T${hora}`);
    const fechaCierre = new Date(cierre);

    if (fechaCierre >= fechaTorneo) {
      return { cierreDebeSerAntes: true };
    }
    return null;
  }

  get errorCierreInscripciones(): string | null {
    if (this.torneoForm.errors?.['cierreDebeSerAntes'] &&
      this.torneoForm.get('cierreInscripciones')?.touched) {
      return 'El cierre de inscripciones debe ser antes de la fecha y hora del torneo';
    }
    return null;
  }
}