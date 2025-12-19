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

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}