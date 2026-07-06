import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';

import { InscripcionAdminService, InscripcionAdminData, EventoActivo } from '../../../services/inscripcion-admin';
import { JugadorService } from '../../../services/jugador';
import { Jugador } from '../../../models/jugador';

@Component({
  selector: 'app-inscripciones-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inscripciones-admin.html',
  styleUrls: ['./inscripciones-admin.css']
})
export class InscripcionesAdminComponent implements OnInit {
  inscripcionForm: FormGroup;

  // Datos
  jugadores: Jugador[] = [];
  jugadoresFiltrados: Jugador[] = [];
  torneos: EventoActivo[] = [];
  ligas: EventoActivo[] = [];
  categorias: any[] = [];
  grupos: any[] = [];

  // UI State
  tipoInscripcion: 'torneo' | 'liga' = 'torneo';
  modoJugador: 'existente' | 'nuevo' = 'nuevo';
  jugadorSeleccionado: Jugador | null = null;
  busquedaJugador: string = '';
  mostrarListaJugadores: boolean = false;

  seccionesAbiertas = {
    tipoInscripcion: true,
    datosJugador: true,
    seleccionEvento: true,
    configuracionAdicional: true
  };

  loading = false;
  error: string | null = null;
  mensajeExito: string | null = null;

  // Selectores de fecha
  dias: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  meses = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' }, { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' }, { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
  ];
  anios: number[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private inscripcionAdminService: InscripcionAdminService,
    private jugadorService: JugadorService
  ) {
    const anioActual = new Date().getFullYear();
    for (let i = anioActual; i >= anioActual - 100; i--) {
      this.anios.push(i);
    }

    this.inscripcionForm = this.fb.group({
      // Tipo
      tipo: ['torneo', Validators.required],

      // Jugador
      modoJugador: ['nuevo', Validators.required],
      idJugador: [null],
      nombre: [''],
      apellido1: [''],
      apellido2: [''],
      telefono: [''],
      dia_nacimiento: [''],
      mes_nacimiento: [''],
      anio_nacimiento: [''],

      // Evento
      idTorneo: [null],
      idCategoria: [null],
      idLiga: [null],
      idGrupoLiga: [null],

      // Configuración adicional
      pago_confirmado: [false],
      monto_pagado: [0],
      rating_inicial: [0],
      numero_jugador: [null],
      posicion: [null],
      notas: ['']
    });

    this.configurarValidadores();
  }

  ngOnInit(): void {
    this.cargarEventosActivos();
    this.cargarJugadores();

    this.inscripcionForm.get('tipo')?.valueChanges.subscribe(tipo => {
      this.tipoInscripcion = tipo;
      this.limpiarSeleccionEvento();
    });

    this.inscripcionForm.get('modoJugador')?.valueChanges.subscribe(modo => {
      this.modoJugador = modo;
      if (modo === 'nuevo') {
        this.jugadorSeleccionado = null;
        this.busquedaJugador = '';
      }
      this.configurarValidadores();
    });
  }

  configurarValidadores(): void {
    const modo = this.inscripcionForm.get('modoJugador')?.value;
    const tipo = this.inscripcionForm.get('tipo')?.value;

    // Limpiar validadores
    ['nombre', 'apellido1', 'telefono', 'dia_nacimiento', 'mes_nacimiento', 'anio_nacimiento', 'idJugador'].forEach(field => {
      this.inscripcionForm.get(field)?.clearValidators();
    });

    if (modo === 'nuevo') {
      this.inscripcionForm.get('nombre')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.inscripcionForm.get('apellido1')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.inscripcionForm.get('telefono')?.setValidators([Validators.required, Validators.pattern(/^\d{10}$/)]);
      this.inscripcionForm.get('dia_nacimiento')?.setValidators(Validators.required);
      this.inscripcionForm.get('mes_nacimiento')?.setValidators(Validators.required);
      this.inscripcionForm.get('anio_nacimiento')?.setValidators(Validators.required);
    } else {
      this.inscripcionForm.get('idJugador')?.setValidators(Validators.required);
    }

    // Validadores según tipo
    if (tipo === 'torneo') {
      this.inscripcionForm.get('idTorneo')?.setValidators(Validators.required);
      this.inscripcionForm.get('idCategoria')?.setValidators(Validators.required);
      this.inscripcionForm.get('idLiga')?.clearValidators();
      this.inscripcionForm.get('idGrupoLiga')?.clearValidators();
    } else {
      this.inscripcionForm.get('idLiga')?.setValidators(Validators.required);
      this.inscripcionForm.get('idGrupoLiga')?.setValidators(Validators.required);
      this.inscripcionForm.get('idTorneo')?.clearValidators();
      this.inscripcionForm.get('idCategoria')?.clearValidators();
    }

    // Actualizar validadores SIN emitir eventos
    Object.keys(this.inscripcionForm.controls).forEach(key => {
      this.inscripcionForm.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  cargarEventosActivos(): void {
    this.loading = true;
    this.inscripcionAdminService.getEventosActivos().subscribe({
      next: (data) => {
        this.torneos = data.torneos || [];
        this.ligas = data.ligas || [];
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar eventos activos';
        this.loading = false;
      }
    });
  }

  cargarJugadores(): void {
    this.jugadorService.getAll({ estado: 'activo' }).subscribe({
      next: (jugadores) => {
        this.jugadores = jugadores;
        this.jugadoresFiltrados = jugadores;
      },
      error: (error) => {
        console.error('Error al cargar jugadores:', error);
      }
    });
  }

  buscarJugador(): void {
    const termino = this.busquedaJugador.toLowerCase().trim();

    if (!termino) {
      this.jugadoresFiltrados = this.jugadores;
      this.mostrarListaJugadores = false;
      return;
    }

    this.jugadoresFiltrados = this.jugadores.filter(j => {
      const nombreCompleto = `${j.nombre} ${j.apellido1} ${j.apellido2 || ''}`.toLowerCase();
      const telefono = j.telefono || '';
      return nombreCompleto.includes(termino) || telefono.includes(termino);
    });

    this.mostrarListaJugadores = true;
  }

  seleccionarJugador(jugador: Jugador): void {
    this.jugadorSeleccionado = jugador;
    this.busquedaJugador = `${jugador.nombre} ${jugador.apellido1} ${jugador.apellido2 || ''}`;
    this.mostrarListaJugadores = false;
    this.inscripcionForm.patchValue({ idJugador: jugador.idJugador });
  }

  limpiarSeleccionJugador(): void {
    this.jugadorSeleccionado = null;
    this.busquedaJugador = '';
    this.mostrarListaJugadores = false;
    this.inscripcionForm.patchValue({ idJugador: null });
  }

  onTorneoChange(event: any): void {
    const torneoId = Number(event.target.value);
    if (torneoId) {
      this.loading = true;
      this.inscripcionAdminService.getCategoriasByTorneo(torneoId).subscribe({
        next: (data) => {
          // Normalizar la estructura de las categorías
          this.categorias = data.map((cat: any) => ({
            idCategoria: cat.categoria?.idCategoria || cat.idCategoria,
            nombre: cat.categoria?.nombre || cat.nombre,
            costo: cat.categoria?.costo || cat.costo,
            categoria: cat.categoria
          }));
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error al cargar categorías';
          this.loading = false;
        }
      });
    } else {
      this.categorias = [];
    }
    this.inscripcionForm.patchValue({ idCategoria: null });
  }

  onLigaChange(event: any): void {
    const ligaId = Number(event.target.value);
    if (ligaId) {
      this.loading = true;
      this.inscripcionAdminService.getGruposByLiga(ligaId).subscribe({
        next: (data) => {
          this.grupos = data;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error al cargar grupos';
          this.loading = false;
        }
      });
    } else {
      this.grupos = [];
    }
    this.inscripcionForm.patchValue({ idGrupoLiga: null });
  }

  limpiarSeleccionEvento(): void {
    this.categorias = [];
    this.grupos = [];
    this.inscripcionForm.patchValue({
      idTorneo: null,
      idCategoria: null,
      idLiga: null,
      idGrupoLiga: null
    });
  }

  toggleSeccion(seccion: keyof typeof this.seccionesAbiertas): void {
    this.seccionesAbiertas[seccion] = !this.seccionesAbiertas[seccion];
  }

  async guardarInscripcion(): Promise<void> {
    if (this.inscripcionForm.invalid) {
      this.error = 'Por favor complete todos los campos requeridos';
      this.marcarCamposComoTocados();
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const formValue = this.inscripcionForm.value;

      const data: InscripcionAdminData = {
        tipo: formValue.tipo,
        notas: formValue.notas?.trim() || undefined,
        pago_confirmado: formValue.pago_confirmado || false,
        monto_pagado: Number(formValue.monto_pagado) || 0
      };

      // Datos del jugador
      if (formValue.modoJugador === 'nuevo') {
        const dia = String(formValue.dia_nacimiento).padStart(2, '0');
        const mes = String(formValue.mes_nacimiento).padStart(2, '0');
        const anio = formValue.anio_nacimiento;

        data.nombre = formValue.nombre.trim();
        data.apellido1 = formValue.apellido1.trim();
        data.apellido2 = formValue.apellido2?.trim() || undefined;
        data.telefono = formValue.telefono.replace(/\s/g, '');
        data.fecha_nacimiento = `${anio}-${mes}-${dia}`;
      } else {
        data.idJugador = Number(formValue.idJugador);
      }

      // Datos del evento
      if (formValue.tipo === 'torneo') {
        data.idTorneo = Number(formValue.idTorneo);
        data.idCategoria = Number(formValue.idCategoria);
      } else {
        data.idLiga = Number(formValue.idLiga);
        data.idGrupoLiga = Number(formValue.idGrupoLiga);
        data.rating_inicial = Number(formValue.rating_inicial) || 0;
        data.numero_jugador = formValue.numero_jugador ? Number(formValue.numero_jugador) : undefined;
        data.posicion = formValue.posicion ? Number(formValue.posicion) : undefined;
      }

      console.log('Datos a enviar:', data);

      const response = await this.inscripcionAdminService.create(data).toPromise();

      if (response?.success) {
        this.mensajeExito = response.message || 'Inscripción creada exitosamente';
        this.inscripcionForm.reset({
          tipo: 'torneo',
          modoJugador: 'nuevo',
          pago_confirmado: false,
          monto_pagado: 0,
          rating_inicial: 0
        });
        this.jugadorSeleccionado = null;
        this.busquedaJugador = '';
        this.categorias = [];
        this.grupos = [];

        setTimeout(() => {
          this.mensajeExito = null;
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error completo:', error);

      if (error.error?.errores && Array.isArray(error.error.errores)) {
        this.error = error.error.errores.join(', ');
      } else if (error.error?.message) {
        this.error = error.error.message;
      } else if (error.status === 400) {
        this.error = 'Datos inválidos. Por favor verifique toda la información.';
      } else if (error.status === 409) {
        this.error = 'El jugador ya está inscrito en este evento.';
      } else {
        this.error = 'Error al crear la inscripción. Por favor intente nuevamente.';
      }
    } finally {
      this.loading = false;
    }
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.inscripcionForm.controls).forEach(key => {
      this.inscripcionForm.get(key)?.markAsTouched();
    });
  }

  cancelar(): void {
    this.router.navigate(['/main-view/inscripciones']);
  }

  cerrarMensajeExito(): void {
    this.mensajeExito = null;
  }
}
