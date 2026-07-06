import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { InfoLigaService } from '../../../services/info-liga';
import { GrupoLigaService } from '../../../services/grupo-liga';
import { RitmoJuegoService } from '../../../services/ritmo-juego';
import { SistemaDesempateService } from '../../../services/sistema-desempates';

import { InfoLiga } from '../../../models/infoLiga';
import { GrupoLiga } from '../../../models/grupoLiga';
import { RitmoJuego } from '../../../models/ritmo-juego';
import { SistemaDesempate } from '../../../models/sistema-desempates';

@Component({
  selector: 'app-editar-liga',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-liga.html',
  styleUrls: ['./editar-liga.css']
})
export class EditarLigaComponent implements OnInit {
  ligaForm: FormGroup;
  idLiga: number = 0;
  ligaOriginal: any = null;

  ritmosJuego: RitmoJuego[] = [];
  sistemasDesempate: SistemaDesempate[] = [];

  gruposExpandidos: boolean[] = [];
  seccionesAbiertas = {
    informacionGeneral: true,
    grupos: true,
    notas: true
  };

  loading = false;
  loadingData = true;
  error: string | null = null;
  mostrarModalCambios = false;
  confirmacionGuardado = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private infoLigaService: InfoLigaService,
    private grupoLigaService: GrupoLigaService,
    private ritmoJuegoService: RitmoJuegoService,
    private sistemaDesempateService: SistemaDesempateService
  ) {
    this.ligaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      lugar: [''],
      direccion: [''],
      fecha_inicio: ['', Validators.required],
      fecha_fin: [''],
      tipo_sistema: ['grupos', Validators.required],
      idRitmoJuego: [null],
      costo_inscripcion: [0, [Validators.min(0)]],
      cierre_inscripciones: ['', Validators.required],
      max_jugadores: [null, [Validators.min(1)]],
      notas: [''],
      configuracionGrupos: this.fb.array([])
    }, { validators: this.cierreAntesDelInicioValidator.bind(this) });
  }

  ngOnInit(): void {
    this.idLiga = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.idLiga) {
      this.router.navigate(['/main-view/ligas']);
      return;
    }
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loadingData = true;
    try {
      const resultado = await forkJoin({
        ritmosJuego: this.ritmoJuegoService.getAll(true),
        sistemasDesempate: this.sistemaDesempateService.getAll(true),
        liga: this.infoLigaService.getById(this.idLiga),
        grupos: this.grupoLigaService.getByLiga(this.idLiga)
      }).toPromise();

      if (!resultado) {
        throw new Error('Error al cargar datos');
      }

      this.ritmosJuego = resultado.ritmosJuego || [];
      this.sistemasDesempate = resultado.sistemasDesempate || [];

      const liga: any = resultado.liga;
      const grupos: any[] = resultado.grupos || [];

      // TEMPORAL: Para debug
      console.log('Liga recibida:', liga);
      console.log('Grupos recibidos:', grupos);

      if (!liga) {
        throw new Error('Liga no encontrada');
      }

      this.ligaOriginal = JSON.parse(JSON.stringify({ ...liga, grupos }));
      this.cargarFormulario(liga, grupos);
    } catch (err: any) {
      this.error = err.error?.message || 'Error al cargar la liga';
      console.error('Error:', err);
    } finally {
      this.loadingData = false;
    }
  }

cargarFormulario(liga: any, grupos: any[]): void {
    // Formatear fecha de inicio
    let fechaInicioISO = '';
    if (liga.fecha_inicio) {
      const fechaInicio = new Date(liga.fecha_inicio);
      const year = fechaInicio.getFullYear();
      const month = String(fechaInicio.getMonth() + 1).padStart(2, '0');
      const day = String(fechaInicio.getDate()).padStart(2, '0');
      fechaInicioISO = `${year}-${month}-${day}`;
    }

    // Formatear fecha de fin
    let fechaFinISO = '';
    if (liga.fecha_fin) {
      const fechaFin = new Date(liga.fecha_fin);
      const year = fechaFin.getFullYear();
      const month = String(fechaFin.getMonth() + 1).padStart(2, '0');
      const day = String(fechaFin.getDate()).padStart(2, '0');
      fechaFinISO = `${year}-${month}-${day}`;
    }

    // Formatear cierre de inscripciones (datetime-local)
    let cierreISO = '';
    if (liga.cierre_inscripciones) {
      const cierre = new Date(liga.cierre_inscripciones);
      const year = cierre.getFullYear();
      const month = String(cierre.getMonth() + 1).padStart(2, '0');
      const day = String(cierre.getDate()).padStart(2, '0');
      const hours = String(cierre.getHours()).padStart(2, '0');
      const minutes = String(cierre.getMinutes()).padStart(2, '0');
      cierreISO = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Actualizar los valores del formulario principal primero
    this.ligaForm.patchValue({
      nombre: liga.nombre || '',
      descripcion: liga.descripcion || '',
      lugar: liga.lugar || '',
      direccion: liga.direccion || '',
      fecha_inicio: fechaInicioISO,
      fecha_fin: fechaFinISO,
      tipo_sistema: liga.tipo_sistema || 'grupos',
      idRitmoJuego: liga.idRitmoJuego || null,
      costo_inscripcion: liga.costo_inscripcion || 0,
      cierre_inscripciones: cierreISO,
      max_jugadores: liga.max_jugadores || null,
      notas: liga.notas || ''
    });

    // Cargar grupos DESPUÉS de actualizar el formulario principal
    if (grupos && Array.isArray(grupos) && grupos.length > 0) {
      grupos.forEach((grupo: any) => {
        this.agregarGrupoConDatos(grupo);
      });
    } else {
      this.agregarGrupo();
    }

    setTimeout(() => {
      this.ligaForm.markAsPristine();
      this.ligaForm.markAsUntouched();
    }, 100);
  }

  get configuracionGrupos(): FormArray {
    return this.ligaForm.get('configuracionGrupos') as FormArray;
  }

  agregarGrupo(): void {
    const numeroGrupo = this.configuracionGrupos.length + 1;
    const config = this.fb.group({
      idGrupoLiga: [null],
      nombre: [`Grupo ${String.fromCharCode(64 + numeroGrupo)}`, Validators.required],
      descripcion: [''],
      rondas: [5, [Validators.required, Validators.min(1)]],
      max_jugadores: [null, [Validators.min(1)]],
      premios: this.fb.array([
        this.crearPremio('Primer Lugar', ''),
        this.crearPremio('Segundo Lugar', ''),
        this.crearPremio('Tercer Lugar', '')
      ]),
      desempates: [[]]
    });

    this.configuracionGrupos.push(config);
    this.gruposExpandidos.push(true);
  }

  agregarGrupoConDatos(grupo: any): void {
    const premiosArray: any[] = [];
    if (grupo?.premios && typeof grupo.premios === 'object') {
      Object.keys(grupo.premios).forEach(key => {
        const valor = grupo.premios[key];
        premiosArray.push(this.crearPremio(`Lugar ${key}`, valor || ''));
      });
    }

    if (premiosArray.length === 0) {
      premiosArray.push(
        this.crearPremio('Primer Lugar', ''),
        this.crearPremio('Segundo Lugar', ''),
        this.crearPremio('Tercer Lugar', '')
      );
    }

    let desempatesArray: number[] = [];
    if (grupo?.desempates) {
      let desempatesData = grupo.desempates;

      if (typeof desempatesData === 'string') {
        try {
          desempatesData = JSON.parse(desempatesData);
        } catch (e) {
          desempatesData = [];
        }
      }

      if (Array.isArray(desempatesData)) {
        desempatesArray = desempatesData
          .map((nombre: string) => this.sistemasDesempate.find(s => s.nombre === nombre)?.idDesempate)
          .filter((id: number | undefined): id is number => id !== undefined);
      }
    }

    const config = this.fb.group({
      idGrupoLiga: [grupo?.idGrupoLiga || null],
      nombre: [grupo?.nombre || 'Grupo A', Validators.required],
      descripcion: [grupo?.descripcion || ''],
      rondas: [grupo?.rondas || 5, [Validators.required, Validators.min(1)]],
      max_jugadores: [grupo?.max_jugadores || null, [Validators.min(1)]],
      premios: this.fb.array(premiosArray),
      desempates: [desempatesArray]
    });

    this.configuracionGrupos.push(config);
    this.gruposExpandidos.push(true);
  }

  eliminarGrupo(index: number): void {
    if (this.configuracionGrupos.length > 1) {
      this.configuracionGrupos.removeAt(index);
      this.gruposExpandidos.splice(index, 1);
    }
  }

  toggleGrupoExpandido(index: number): void {
    if (index < 0 || index >= this.gruposExpandidos.length) {
      return;
    }
    this.gruposExpandidos[index] = !this.gruposExpandidos[index];
  }

  crearPremio(descripcion: string, monto: string): FormGroup {
    return this.fb.group({
      descripcion: [descripcion],
      monto: [monto]
    });
  }

  getPremios(grupoIndex: number): FormArray {
    const grupo = this.configuracionGrupos.at(grupoIndex);
    if (!grupo) {
      return this.fb.array([]);
    }
    return grupo.get('premios') as FormArray;
  }

  agregarPremio(grupoIndex: number): void {
    if (grupoIndex >= this.configuracionGrupos.length) {
      return;
    }

    const premios = this.getPremios(grupoIndex);
    if (!premios) {
      return;
    }

    const nextLugar = premios.length + 1;
    let descripcion = '';

    const nombres = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo'];
    descripcion = nextLugar <= nombres.length
      ? `${nombres[nextLugar - 1]} Lugar`
      : `Lugar ${nextLugar}`;

    premios.push(this.crearPremio(descripcion, ''));
  }

  eliminarPremio(grupoIndex: number, premioIndex: number): void {
    if (grupoIndex >= this.configuracionGrupos.length) {
      return;
    }

    const premios = this.getPremios(grupoIndex);
    if (!premios || premios.length <= 1) {
      return;
    }

    premios.removeAt(premioIndex);
  }

  toggleDesempate(grupoIndex: number, sistemaId: number): void {
    if (grupoIndex >= this.configuracionGrupos.length) {
      return;
    }

    const config = this.configuracionGrupos.at(grupoIndex);
    if (!config) {
      return;
    }

    const desempates = config.get('desempates')?.value || [];
    const index = desempates.indexOf(sistemaId);

    if (index > -1) {
      desempates.splice(index, 1);
    } else {
      desempates.push(sistemaId);
    }

    config.patchValue({ desempates });
  }

  isDesempateSeleccionado(grupoIndex: number, sistemaId: number): boolean {
    if (grupoIndex >= this.configuracionGrupos.length) {
      return false;
    }

    const config = this.configuracionGrupos.at(grupoIndex);
    if (!config) {
      return false;
    }

    const desempates = config.get('desempates')?.value || [];
    return desempates.includes(sistemaId);
  }

  getPrioridadDesempate(grupoIndex: number, sistemaId: number): number {
    if (grupoIndex >= this.configuracionGrupos.length) {
      return 0;
    }

    const config = this.configuracionGrupos.at(grupoIndex);
    if (!config) {
      return 0;
    }

    const desempates = config.get('desempates')?.value || [];
    const index = desempates.indexOf(sistemaId);
    return index > -1 ? index + 1 : 0;
  }

  toggleSeccion(seccion: keyof typeof this.seccionesAbiertas): void {
    this.seccionesAbiertas[seccion] = !this.seccionesAbiertas[seccion];
  }

  hayFormularioSucio(): boolean {
    if (this.ligaForm.dirty) {
      return true;
    }

    if (!this.ligaOriginal) {
      return false;
    }

    const valoresActuales = JSON.stringify(this.ligaForm.value);
    const valoresOriginalesForm = this.construirFormularioOriginal();
    const valoresOriginales = JSON.stringify(valoresOriginalesForm);

    return valoresActuales !== valoresOriginales;
  }

  construirFormularioOriginal(): any {
    if (!this.ligaOriginal) return {};

    const fechaInicioISO = typeof this.ligaOriginal.fecha_inicio === 'string'
      ? this.ligaOriginal.fecha_inicio.split('T')[0]
      : '';

    const fechaFinISO = this.ligaOriginal.fecha_fin && typeof this.ligaOriginal.fecha_fin === 'string'
      ? this.ligaOriginal.fecha_fin.split('T')[0]
      : '';

    const cierreRaw = this.ligaOriginal.cierre_inscripciones || this.ligaOriginal.cierreInscripciones;
    let cierreISO = '';
    if (cierreRaw && typeof cierreRaw === 'string') {
      cierreISO = cierreRaw.substring(0, 16);
    }

    // Construir configuración de grupos de manera segura
    let configuracionGrupos: any[] = [];
    if (this.configuracionGrupos && this.configuracionGrupos.length > 0) {
      try {
        configuracionGrupos = this.ligaForm.value.configuracionGrupos || [];
      } catch (e) {
        configuracionGrupos = [];
      }
    }

    return {
      nombre: this.ligaOriginal.nombre || '',
      descripcion: this.ligaOriginal.descripcion || '',
      lugar: this.ligaOriginal.lugar || '',
      direccion: this.ligaOriginal.direccion || '',
      fecha_inicio: fechaInicioISO,
      fecha_fin: fechaFinISO,
      tipo_sistema: this.ligaOriginal.tipo_sistema || 'grupos',
      idRitmoJuego: this.ligaOriginal.idRitmoJuego || null,
      costo_inscripcion: this.ligaOriginal.costo_inscripcion || 0,
      cierre_inscripciones: cierreISO,
      max_jugadores: this.ligaOriginal.max_jugadores || null,
      notas: this.ligaOriginal.notas || '',
      configuracionGrupos: configuracionGrupos
    };
  }

  cancelar(): void {
    const esSucio = this.hayFormularioSucio();

    if (esSucio) {
      this.mostrarModalCambios = true;
    } else {
      this.router.navigate(['/main-view/ligas']);
    }
  }

  cancelarSalir(): void {
    this.mostrarModalCambios = false;
  }

  confirmarSalir(): void {
    this.mostrarModalCambios = false;
    this.router.navigate(['/main-view/ligas']);
  }

  async guardarYSalir(): Promise<void> {
    this.mostrarModalCambios = false;
    this.confirmacionGuardado = true;
    await this.guardarLiga();
  }

  async guardarLiga(): Promise<void> {
    if (this.ligaForm.invalid || this.configuracionGrupos.length === 0) {
      this.error = 'Por favor complete todos los campos requeridos y agregue al menos un grupo';
      return;
    }

    const hayGrupoSinDesempates = this.configuracionGrupos.controls.some(grupo => {
      const desempates = grupo.get('desempates')?.value || [];
      return desempates.length < 2;
    });

    if (hayGrupoSinDesempates) {
      this.error = 'Cada grupo debe tener al menos 2 sistemas de desempate seleccionados';
      return;
    }

    const esSucio = this.hayFormularioSucio();

    if (esSucio && !this.confirmacionGuardado) {
      this.mostrarModalCambios = true;
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const formValue = this.ligaForm.value;

      const ligaData = {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion || null,
        lugar: formValue.lugar || null,
        direccion: formValue.direccion || null,
        fecha_inicio: formValue.fecha_inicio,
        fecha_fin: formValue.fecha_fin || null,
        tipo_sistema: formValue.tipo_sistema,
        idRitmoJuego: formValue.idRitmoJuego || null,
        costo_inscripcion: formValue.costo_inscripcion || 0,
        cierre_inscripciones: formValue.cierre_inscripciones,
        max_jugadores: formValue.max_jugadores || null,
        notas: formValue.notas || null,
        activo: 1
      };

      await this.infoLigaService.update(this.idLiga, ligaData).toPromise();

      for (const config of formValue.configuracionGrupos) {
        const premiosObj: any = {};
        config.premios.forEach((p: any, idx: number) => {
          if (p.monto && p.monto.trim()) {
            premiosObj[idx + 1] = p.monto;
          }
        });

        const grupoData: any = {
          idLiga: this.idLiga,
          nombre: config.nombre,
          descripcion: config.descripcion || null,
          rondas: config.rondas,
          max_jugadores: config.max_jugadores || null,
          premios: Object.keys(premiosObj).length > 0 ? premiosObj : null,
          desempates: config.desempates.map((id: number) =>
            this.sistemasDesempate.find(s => s.idDesempate === id)?.nombre || ''
          ),
          activo: 1
        };

        if (config.idGrupoLiga) {
          await this.grupoLigaService.update(config.idGrupoLiga, grupoData).toPromise();
        } else {
          await this.grupoLigaService.create(grupoData).toPromise();
        }
      }

      this.router.navigate(['/main-view/ligas']);
    } catch (err: any) {
      this.error = err.error?.message || 'Error al actualizar la liga';
      console.error('Error completo:', err);
    } finally {
      this.loading = false;
      this.confirmacionGuardado = false;
    }
  }

  private cierreAntesDelInicioValidator(formGroup: AbstractControl): ValidationErrors | null {
    const fechaInicioControl = formGroup.get('fecha_inicio');
    const cierreControl = formGroup.get('cierre_inscripciones');

    if (!fechaInicioControl || !cierreControl) {
      return null;
    }

    const fechaInicio = fechaInicioControl.value;
    const cierre = cierreControl.value;

    if (!fechaInicio || !cierre) {
      return null;
    }

    const fechaInicioDate = new Date(fechaInicio);
    const fechaCierre = new Date(cierre);

    if (fechaCierre >= fechaInicioDate) {
      return { cierreDebeSerAntes: true };
    }

    return null;
  }

  get errorCierreInscripciones(): string | null {
    if (this.ligaForm.errors?.['cierreDebeSerAntes'] &&
      this.ligaForm.get('cierre_inscripciones')?.touched) {
      return 'El cierre de inscripciones debe ser antes de la fecha de inicio de la liga';
    }
    return null;
  }
}
