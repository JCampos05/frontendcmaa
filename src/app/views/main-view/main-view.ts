import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../componentes/principales/header/header';
import { SidebarComponent } from '../../componentes/principales/sidebar/sidebar';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './main-view.html',
  styleUrl: './main-view.css',
})
export class MainView {
  sidebarCollapsed = false;

  get esMobile(): boolean {
    return window.innerWidth <= 768;
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