import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { ApiService, ModelVersion } from '../api.service';

@Component({
  selector: 'app-version-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatCardModule],
  template: `
    <h3>Compare Versions</h3>
    <div class="row">
      <mat-form-field appearance="outline">
        <mat-label>Version ID 1</mat-label>
        <input matInput [(ngModel)]="v1">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Version ID 2</mat-label>
        <input matInput [(ngModel)]="v2">
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="compare()" [disabled]="loading || !v1 || !v2">Compare</button>
    </div>
    <div *ngIf="loading" class="center"><mat-spinner diameter="32"></mat-spinner></div>
    <div *ngIf="error" class="error-msg">{{ error }}</div>
    <div class="compare-grid" *ngIf="results.length === 2">
      <mat-card *ngFor="let v of results">
        <mat-card-title>{{ v.version }}</mat-card-title>
        <mat-card-content>
          <p><strong>Stage:</strong> <span class="stage-badge stage-{{v.stage}}">{{ v.stage }}</span></p>
          <p><strong>Approved:</strong> {{ v.approved ? '✔ Yes' : 'No' }}</p>
          <p><strong>Artifact URI:</strong> {{ v.artifact_uri || '—' }}</p>
          <p><strong>Training Data:</strong> {{ v.training_data_ref || '—' }}</p>
          <p><strong>Tags:</strong> {{ v.tags || '—' }}</p>
          <p><strong>Created:</strong> {{ v.created_at | date:'medium' }}</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .row { display:flex; gap:12px; align-items:center; margin-bottom:16px }
    .row mat-form-field { flex:1 }
    .center { display:flex; justify-content:center; padding:24px }
    .error-msg { color:#f44336; font-size:13px }
    .compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px }
    .stage-badge { padding:2px 8px; border-radius:12px; font-size:12px; font-weight:500; background:#e0e0e0 }
    .stage-PRODUCTION { background:#c8e6c9; color:#2e7d32 }
    .stage-APPROVED { background:#bbdefb; color:#1565c0 }
    .stage-DRAFT { background:#f5f5f5; color:#555 }
    .stage-ARCHIVED { background:#ffccbc; color:#bf360c }
  `]
})
export class VersionCompareComponent {
  v1 = ''; v2 = '';
  results: ModelVersion[] = [];
  loading = false; error = '';

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  compare() {
    const modelId = this.route.snapshot.paramMap.get('id')!;
    this.loading = true; this.error = ''; this.results = [];
    this.api.compareVersions(modelId, this.v1, this.v2).subscribe({
      next: r => { this.results = r; this.loading = false; },
      error: e => { this.error = e.error?.detail || 'Comparison failed.'; this.loading = false; }
    });
  }
}
