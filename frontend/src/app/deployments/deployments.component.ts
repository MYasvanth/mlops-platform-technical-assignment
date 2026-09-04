import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { ApiService, Deployment } from '../api.service';

@Component({
  selector: 'app-deployments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule,
    MatExpansionModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule],
  template: `
    <h2>Deployments</h2>

    <mat-card class="create-card">
      <mat-card-title>New Deployment</mat-card-title>
      <mat-card-content>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Model ID</mat-label>
            <input matInput [(ngModel)]="form.model_id">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Version ID</mat-label>
            <input matInput [(ngModel)]="form.version_id">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Environment</mat-label>
            <mat-select [(ngModel)]="form.environment">
              <mat-option value="staging">staging</mat-option>
              <mat-option value="production">production</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Idempotency Key (optional)</mat-label>
            <input matInput [(ngModel)]="form.idempotency_key">
          </mat-form-field>
        </div>
        <div *ngIf="createError" class="error-msg">{{ createError }}</div>
        <button mat-raised-button color="primary" (click)="deploy()" [disabled]="creating">
          {{ creating ? 'Deploying...' : 'Deploy' }}
        </button>
      </mat-card-content>
    </mat-card>

    <div *ngIf="loading" class="center"><mat-spinner diameter="40"></mat-spinner></div>
    <div *ngIf="error" class="error-msg">{{ error }}</div>
    <div *ngIf="!loading && !error && deployments.length === 0" class="empty-msg">No deployments yet.</div>

    <mat-accordion *ngIf="!loading && deployments.length > 0">
      <mat-expansion-panel *ngFor="let d of deployments">
        <mat-expansion-panel-header>
          <mat-panel-title>{{ d.environment | uppercase }} — {{ d.id | slice:0:8 }}</mat-panel-title>
          <mat-panel-description>
            <span class="status-badge status-{{d.status}}">{{ d.status }}</span>
            &nbsp; {{ d.created_at | date:'short' }}
          </mat-panel-description>
        </mat-expansion-panel-header>

        <p><strong>Model ID:</strong> {{ d.model_id }}</p>
        <p><strong>Version ID:</strong> {{ d.version_id }}</p>
        <p *ngIf="d.error_message"><strong>Error:</strong> <span class="error-msg">{{ d.error_message }}</span></p>

        <div class="actions">
          <button mat-stroked-button color="warn" *ngIf="d.status === 'FAILED'" (click)="retry(d)" [disabled]="d.acting">Retry</button>
          <button mat-stroked-button color="warn" *ngIf="d.status === 'SUCCEEDED'" (click)="rollback(d)" [disabled]="d.acting">Rollback</button>
          <span *ngIf="d.actionError" class="error-msg">{{ d.actionError }}</span>
        </div>

        <h4>Event Timeline</h4>
        <div *ngIf="d.events.length === 0" class="empty-msg">No events.</div>
        <table mat-table [dataSource]="d.events" *ngIf="d.events.length > 0" class="full-width">
          <ng-container matColumnDef="event">
            <th mat-header-cell *matHeaderCellDef>Event</th>
            <td mat-cell *matCellDef="let e">{{ e.event }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let e"><span class="status-badge status-{{e.status}}">{{ e.status }}</span></td>
          </ng-container>
          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>Time</th>
            <td mat-cell *matCellDef="let e">{{ e.created_at | date:'medium' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="eventCols"></tr>
          <tr mat-row *matRowDef="let row; columns: eventCols;"></tr>
        </table>
      </mat-expansion-panel>
    </mat-accordion>
  `,
  styles: [`
    .create-card { margin-bottom:24px }
    .form-row { display:flex; gap:12px; flex-wrap:wrap }
    .form-row mat-form-field { flex:1; min-width:160px }
    .center { display:flex; justify-content:center; padding:40px }
    .error-msg { color:#f44336; font-size:13px }
    .empty-msg { padding:16px; color:#888 }
    .full-width { width:100% }
    .actions { margin:8px 0 }
    .status-badge { padding:2px 8px; border-radius:12px; font-size:12px; font-weight:500; background:#e0e0e0 }
    .status-SUCCEEDED { background:#c8e6c9; color:#2e7d32 }
    .status-FAILED { background:#ffcdd2; color:#c62828 }
    .status-ROLLED_BACK { background:#ffe0b2; color:#e65100 }
    .status-DEPLOYING { background:#bbdefb; color:#1565c0 }
  `]
})
export class DeploymentsComponent implements OnInit {
  deployments: any[] = [];
  loading = false;
  error = '';
  creating = false;
  createError = '';
  form = { model_id: '', version_id: '', environment: 'staging', idempotency_key: '' };
  eventCols = ['event', 'status', 'created_at'];

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    this.api.getDeployments().subscribe({
      next: d => { this.deployments = d; this.loading = false; },
      error: e => { this.error = 'Failed to load deployments.'; this.loading = false; }
    });
  }

  deploy() {
    if (!this.form.model_id || !this.form.version_id) { this.createError = 'Model ID and Version ID are required.'; return; }
    this.creating = true; this.createError = '';
    const payload: any = { model_id: this.form.model_id, version_id: this.form.version_id, environment: this.form.environment };
    if (this.form.idempotency_key) payload.idempotency_key = this.form.idempotency_key;
    this.api.createDeployment(payload).subscribe({
      next: () => { this.creating = false; this.form = { model_id: '', version_id: '', environment: 'staging', idempotency_key: '' }; this.load(); },
      error: e => { this.createError = e.error?.detail || 'Deployment failed.'; this.creating = false; }
    });
  }

  retry(d: any) {
    d.acting = true; d.actionError = '';
    this.api.retryDeployment(d.id).subscribe({
      next: updated => { Object.assign(d, updated); d.acting = false; },
      error: e => { d.actionError = e.error?.detail || 'Retry failed.'; d.acting = false; }
    });
  }

  rollback(d: any) {
    d.acting = true; d.actionError = '';
    this.api.rollbackDeployment(d.id).subscribe({
      next: updated => { Object.assign(d, updated); d.acting = false; },
      error: e => { d.actionError = e.error?.detail || 'Rollback failed.'; d.acting = false; }
    });
  }
}
