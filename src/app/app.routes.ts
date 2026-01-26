import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guards';

export const routes: Routes = [
    {path: '', loadComponent: () => import('./views/landing-page/landing-page').then(m => m.LandingComponent)},
    {path: 'landing-page', loadComponent: () => import('./views/landing-page/landing-page').then(m => m.LandingComponent)},
    {path: 'login', loadComponent: () => import('./authentication/login/login').then(m => m.LoginComponent)},
    {path: 'inscripcion/:id' , loadComponent: () => import('./views/main-view/inscripcion/inscripcion').then(m => m.InscripcionComponent)},
    {path: 'players-stats' , loadComponent: () => import('./views/player-stats/player-stats').then(m => m.PlayerStatsComponent)},
    {path: 'jugador-resultado' , loadComponent: () => import('./views/jugador-resultado/jugador-resultado').then(m => m.JugadorResultadoComponent)},
    {path: 'reloj-section' , loadComponent: () => import('./views/reloj-section/reloj-section').then(m => m.RelojSectionComponent)},
    {path: 'jugador-liga' , loadComponent: () => import('./views/jugador-liga/jugador-liga').then(m => m.JugadorLigaComponent)},
    {path: 'main-view', loadComponent: () => import('./views/main-view/main-view').then(m => m.MainView),
    
        canActivate: [authGuard],
        children: [
            // Torneo Actual y sus subapartados
            {path: 'torneo-actual', loadComponent: () => import('./views/main-view/torneo-actual/torneo-actual').then(m => m.TorneoActualComponent)},
            {path: 'inscripciones-torneo', loadComponent: () => import('./views/main-view/inscripciones-torneo/inscripciones-torneo').then(m => m.InscripcionesAdminComponent)},
            {path: 'listas', loadComponent: () => import('./views/main-view/listas-torneo/listas-torneo').then(m => m.ListasTorneoComponent)},
            {path: 'mesas-torneo', loadComponent: () => import('./views/main-view/mesas-torneo/mesas-torneo').then(m => m.MesasTorneoComponent)},
            {path: 'resultados-torneo', loadComponent: () => import('./views/main-view/resultados-torneo/resultados-torneo').then(m => m.ResultadosTorneoComponent)},
            {path: 'historial-jugador-torneo' , loadComponent: () => import('./views/main-view/historial-jugador-torneo/historial-jugador-torneo').then(m => m.HistorialJugadorComponent)},
            // Inscripciones y sus subapartados
            {path: 'inscripciones-generales' , loadComponent: () => import('./views/main-view/inscripciones-generales/inscripciones-generales').then(m => m.InscripcionesGeneralesComponent)},
            {path: 'jugadores-torneo', loadComponent: () => import('./views/main-view/jugadores-torneo/jugadores-torneo').then(m => m.JugadoresTorneoComponent)},
            {path: 'estadisticas-pago', loadComponent: () => import('./views/main-view/estadisticas-pagos/estadisticas-pagos').then(m => m.EstadisticasPagosComponent)},
            // Gestión de Torneos
            {path: 'nuevo-torneo', loadComponent: () => import('./views/main-view/nuevo-torneo/nuevo-torneo').then(m => m.NuevoTorneoComponent)},
            {path: 'configuracion-torneos', loadComponent: () => import('./views/main-view/configuracion-torneos/configuracion-torneos').then(m => m.ConfiguracionTorneosComponent)},
            {path: 'resultado-todos-torneos' , loadComponent: () => import('./views/main-view/resultado-todos-torneos/resultado-todos-torneos').then(m => m.ResultadosTodoTorneosComponent)},
            {path: 'visualizacion-mesas' , loadComponent: () => import('./views/main-view/visualizacion-mesas/visualizacion-mesas').then(m => m.VisualizacionMesasComponent)},
            {path: 'torneos', loadComponent: () => import('./views/main-view/torneos/torneos').then(m => m.TorneosComponent)},
            {path: 'editar-torneo/:id', loadComponent: () => import('./views/main-view/editar-torneo/editar-torneo').then(m => m.EditarTorneoComponent)},
            {path: 'detalle-torneo/:id', loadComponent: () => import('./views/main-view/torneo-detalles/torneo-detalles').then(m => m.TorneoDetalleComponent)},
            {path: 'sistemas-pago' , loadComponent: () => import('./views/main-view/sistemas-pago/sistemas-pago').then(m => m.SistemasPagoComponent)},
            //{path: 'resultados-torneo/:id', loadComponent: () => import('./views/main-view/resultados-torneo/resultados-torneo').then(m => m.ResultadosTorneoComponent)},
            // Gestión Liga
            {path: 'ligas', loadComponent: () => import('./views/main-view/ligas/ligas').then(m => m.LigasComponent)},
            {path: 'detalle-liga/:id', loadComponent: () => import('./views/main-view/detalles-liga/detalles-liga').then(m => m.DetalleLigaComponent)},
            {path: 'editar-liga/:id', loadComponent: () => import('./views/main-view/editar-liga/editar-liga').then(m => m.EditarLigaComponent)},
            {path: 'nueva-liga' , loadComponent: () => import('./views/main-view/nueva-liga/nueva-liga').then(m => m.NuevaLigaComponent)},
            {path: 'inscripciones-liga' ,loadComponent: () => import('./views/main-view/inscripciones-liga/inscripciones-liga').then(m => m.InscripcionesLigaComponent)},
            {path: 'mesas-liga' , loadComponent: () => import('./views/main-view/mesas-liga/mesas-liga').then(m => m.MesasLigaComponent)},
            // Gestión de Jugadores
            {path: 'gestion-jugadores', loadComponent: () => import('./views/main-view/gestion-jugadores/gestion-jugadores').then(m => m.GestionJugadoresComponent)},
            {path: 'inscripcion-admin', loadComponent: () => import('./views/main-view/inscripciones-admin/inscripciones-admin').then(m => m.InscripcionesAdminComponent)},
            // Sistema
            {path: 'configuracion', loadComponent: () => import('./views/main-view/configuracion/configuracion').then(m => m.Configuracion)}
        ]
    },
    {path: '**', redirectTo: ''}
];