import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService, MLModel } from '../api.service';
import { CreateModelDialogComponent } from './create-model-dialog.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-models',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatTableModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatDialogModule],
  template: `
    <div class="page-header">
      <h2>Model Registry</h2>
      <button mat-raised-button color="primary" (click)="openCreate()">+ Register Model</button>
    </div>
    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Search</mat-label>
      <input matInput [(ngModel)]="search" placeholder="Name, owner, framework...">
    </mat-form-field>
    <div *ngIf="loading" class="center"><mat-spinner diameter="40"></mat-spinner></div>
    <div *ngIf="error" class="error-msg">{{ error }}</div>
    <div *ngIf="!loading && !error && filtered.length === 0" class="empty-msg">No models found.</div>
    <table mat-table [dataSource]="filtered" *ngIf="!loading && filtered.length > 0" class="full-width">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let m"><a [routerLink]="['/models', m.id]">{{ m.name }}</a></td>
      </ng-container>
      <ng-container matColumnDef="owner">
        <th mat-header-cell *matHeaderCellDef>Owner</th>
        <td mat-cell *matCellDef="let m">{{ m.owner }}</td>
      </ng-container>
      <ng-container matColumnDef="framework">
        <th mat-header-cell *matHeaderCellDef>Framework</th>
        <td mat-cell *matCellDef="let m">{{ m.framework }}</td>
      </ng-container>
      <ng-container matColumnDef="created_at">
        <th mat-header-cell *matHeaderCellDef>Created</th>
        <td mat-cell *matCellDef="let m">{{ m.created_at | date:'short' }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px }
    .search-field { width:100%; margin-bottom:16px }
    .full-width { width:100% }
    .center { display:flex; justify-content:center; padding:40px }
    .error-msg { color:#f44336; padding:16px }
    .empty-msg { padding:40px; text-align:center; color:#888 }
  `]
})
export class ModelsComponent implements OnInit {
  models: MLModel[] = [];
  loading = false;
  error = '';
  search = '';
  cols = ['name', 'owner', 'framework', 'created_at'];

  constructor(private api: ApiService, private dialog: MatDialog) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    this.api.getModels().subscribe({
      next: m => { this.models = m; this.loading = false; },
      error: e => { this.error = 'Failed to load models: ' + (e.message || 'Unknown error'); this.loading = false; }
    });
  }

  get filtered() {
    const q = this.search.toLowerCase();
    return this.models.filter(m =>
      m.name.toLowerCase().includes(q) || m.owner.toLowerCase().includes(q) || m.framework.toLowerCase().includes(q)
    );
  }

  openCreate() {
    this.dialog.open(CreateModelDialogComponent, { width: '420px' })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }
}
