import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../componentes/principales/header/header';
import { SidebarComponent } from '../../componentes/principales/sidebar/sidebar';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './main-view.html',
  styleUrl: './main-view.css',
})
export class MainView implements OnInit, OnDestroy {
  sidebarCollapsed = false;

  // Detectar si es móvil — reactivo a resize real vía BreakpointObserver
  esMobile = false;
  private breakpointSubscription?: Subscription;

  constructor(private breakpointObserver: BreakpointObserver) { }

  ngOnInit(): void {
    this.breakpointSubscription = this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe(result => {
        this.esMobile = result.matches;
      });
  }

  ngOnDestroy(): void {
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
  }

  cerrarSidebar(): void {
    if (this.esMobile) {
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
