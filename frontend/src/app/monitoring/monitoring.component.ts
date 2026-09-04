import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { ApiService, Metric } from '../api.service';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatTableModule, MatCardModule],
  template: `
    <h2>Monitoring Dashboard</h2>
    <div class="search-row">
      <mat-form-field appearance="outline">
        <mat-label>Model ID</mat-label>
        <input matInput [(ngModel)]="modelId">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="load()" [disabled]="loading || !modelId">Load Metrics</button>
    </div>

    <div *ngIf="loading" class="center"><mat-spinner diameter="40"></mat-spinner></div>
    <div *ngIf="error" class="error-msg">{{ error }}</div>
    <div *ngIf="!loading && searched && metrics.length === 0" class="empty-msg">No metrics found for this model.</div>

    <div class="summary-cards" *ngIf="latest">
      <mat-card><mat-card-content><div class="metric-label">Latency</div><div class="metric-value">{{ latest.latency_ms ?? '—' }} ms</div></mat-card-content></mat-card>
      <mat-card><mat-card-content><div class="metric-label">Throughput</div><div class="metric-value">{{ latest.throughput_rpm ?? '—' }} rpm</div></mat-card-content></mat-card>
      <mat-card><mat-card-content><div class="metric-label">Error Rate</div><div class="metric-value">{{ latest.error_rate != null ? (latest.error_rate | percent:'1.2') : '—' }}</div></mat-card-content></mat-card>
      <mat-card><mat-card-content><div class="metric-label">Quality Score</div><div class="metric-value">{{ latest.quality_score ?? '—' }}</div></mat-card-content></mat-card>
      <mat-card><mat-card-content><div class="metric-label">Drift Score</div><div class="metric-value">{{ latest.drift_score ?? '—' }}</div></mat-card-content></mat-card>
      <mat-card><mat-card-content><div class="metric-label">Availability</div><div class="metric-value">{{ latest.availability != null ? (latest.availability | percent:'1.2') : '—' }}</div></mat-card-content></mat-card>
      <mat-card><mat-card-content><div class="metric-label">Last Inference</div><div class="metric-value small">{{ latest.last_inference_at ? (latest.last_inference_at | date:'short') : '—' }}</div></mat-card-content></mat-card>
      <mat-card><mat-card-content><div class="metric-label">Monitoring Status</div><div class="metric-value small">{{ latest.monitoring_status ?? '—' }}</div></mat-card-content></mat-card>
    </div>

    <table mat-table [dataSource]="metrics" *ngIf="metrics.length > 0" class="full-width">
      <ng-container matColumnDef="timestamp">
        <th mat-header-cell *matHeaderCellDef>Timestamp</th>
        <td mat-cell *matCellDef="let m">{{ m.timestamp | date:'medium' }}</td>
      </ng-container>
      <ng-container matColumnDef="version">
        <th mat-header-cell *matHeaderCellDef>Version</th>
        <td mat-cell *matCellDef="let m">{{ m.version }}</td>
      </ng-container>
      <ng-container matColumnDef="environment">
        <th mat-header-cell *matHeaderCellDef>Env</th>
        <td mat-cell *matCellDef="let m">{{ m.environment }}</td>
      </ng-container>
      <ng-container matColumnDef="latency_ms">
        <th mat-header-cell *matHeaderCellDef>Latency (ms)</th>
        <td mat-cell *matCellDef="let m">{{ m.latency_ms ?? '—' }}</td>
      </ng-container>
      <ng-container matColumnDef="error_rate">
        <th mat-header-cell *matHeaderCellDef>Error Rate</th>
        <td mat-cell *matCellDef="let m">{{ m.error_rate != null ? (m.error_rate | percent:'1.2') : '—' }}</td>
      </ng-container>
      <ng-container matColumnDef="drift_score">
        <th mat-header-cell *matHeaderCellDef>Drift</th>
        <td mat-cell *matCellDef="let m">{{ m.drift_score ?? '—' }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  `,
  styles: [`
    .search-row { display:flex; gap:12px; align-items:center; margin-bottom:16px }
    .center { display:flex; justify-content:center; padding:40px }
    .error-msg { color:#f44336; padding:8px }
    .empty-msg { padding:32px; text-align:center; color:#888 }
    .full-width { width:100%; margin-top:16px }
    .summary-cards { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px }
    .summary-cards mat-card { flex:1; min-width:120px; text-align:center }
    .metric-label { font-size:12px; color:#888 }
    .metric-value { font-size:22px; font-weight:600; margin-top:4px }
  `]
})
export class MonitoringComponent implements OnInit {
  modelId = '';
  metrics: Metric[] = [];
  loading = false;
  error = '';
  searched = false;
  cols = ['timestamp', 'version', 'environment', 'latency_ms', 'error_rate', 'drift_score'];

  constructor(private api: ApiService) {}

  ngOnInit() {}

  get latest(): Metric | null { return this.metrics[0] ?? null; }

  load() {
    if (!this.modelId) return;
    this.loading = true; this.error = ''; this.searched = false;
    this.api.getMetrics(this.modelId).subscribe({
      next: m => { this.metrics = m; this.loading = false; this.searched = true; },
      error: e => { this.error = e.error?.detail || 'Failed to load metrics.'; this.loading = false; this.searched = true; }
    });
  }
}
