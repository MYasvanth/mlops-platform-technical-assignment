import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary">
      <span>MLOps Platform</span>
      <span style="flex:1"></span>
      <a mat-button routerLink="/models" routerLinkActive="active-link">Models</a>
      <a mat-button routerLink="/deployments" routerLinkActive="active-link">Deployments</a>
      <a mat-button routerLink="/monitoring" routerLinkActive="active-link">Monitoring</a>
    </mat-toolbar>
    <div class="container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .container { padding: 24px; max-width: 1200px; margin: 0 auto }
    .active-link { background: rgba(255,255,255,0.15); border-radius: 4px }
  `]
})
export class AppComponent {}
