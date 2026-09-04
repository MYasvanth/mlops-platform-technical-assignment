import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { ApiService, MLModel, ModelVersion } from '../api.service';
import { CreateVersionDialogComponent } from './create-version-dialog.component';

const STAGE_ORDER = ['DRAFT','VALIDATED','APPROVED','STAGING','PRODUCTION','ARCHIVED'];

@Component({
  selector: 'app-model-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatTableModule, MatButtonModule,
    MatChipsModule, MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule, MatCardModule, MatDialogModule],
  template: `
    <a routerLink="/models" mat-button>← Back to Models</a>
    <div *ngIf="loading" class="center"><mat-spinner diameter="40"></mat-spinner></div>
    <div *ngIf="error" class="error-msg">{{ error }}</div>

    <ng-container *ngIf="model && !loading">
      <mat-card class="model-card">
        <mat-card-title>{{ model.name }}</mat-card-title>
        <mat-card-content>
          <p><strong>Owner:</strong> {{ model.owner }} &nbsp; <strong>Framework:</strong> {{ model.framework }}</p>
          <p *ngIf="model.description">{{ model.description }}</p>
        </mat-card-content>
      </mat-card>

      <div class="section-header">
        <h3>Versions</h3>
        <button mat-raised-button color="accent" (click)="openAddVersion()">+ Add Version</button>
      </div>

      <div *ngIf="versions.length === 0" class="empty-msg">No versions yet.</div>

      <table mat-table [dataSource]="versions" *ngIf="versions.length > 0" class="full-width">
        <ng-container matColumnDef="version">
          <th mat-header-cell *matHeaderCellDef>Version</th>
          <td mat-cell *matCellDef="let v">{{ v.version }}</td>
        </ng-container>
        <ng-container matColumnDef="stage">
          <th mat-header-cell *matHeaderCellDef>Stage</th>
          <td mat-cell *matCellDef="let v">
            <span class="stage-badge stage-{{v.stage}}">{{ v.stage }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="approved">
          <th mat-header-cell *matHeaderCellDef>Approved</th>
          <td mat-cell *matCellDef="let v">
            <span *ngIf="v.approved" style="color:green">✔ Yes</span>
            <span *ngIf="!v.approved" style="color:#888">No</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let v">
            <button mat-stroked-button color="primary" *ngIf="nextStage(v)" (click)="promote(v)"
              [disabled]="v.promoting">
              → {{ nextStage(v) }}
            </button>
            <button mat-stroked-button color="accent" *ngIf="!v.approved && v.stage !== 'ARCHIVED'"
              (click)="approve(v)" [disabled]="v.approving" style="margin-left:8px">
              Approve
            </button>
            <span *ngIf="v.stageError" class="error-msg">{{ v.stageError }}</span>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    </ng-container>
  `,
  styles: [`
    .model-card { margin:16px 0 }
    .section-header { display:flex; justify-content:space-between; align-items:center; margin:16px 0 8px }
    .full-width { width:100% }
    .center { display:flex; justify-content:center; padding:40px }
    .error-msg { color:#f44336; font-size:12px }
    .empty-msg { padding:24px; text-align:center; color:#888 }
    .stage-badge { padding:2px 8px; border-radius:12px; font-size:12px; font-weight:500; background:#e0e0e0 }
    .stage-PRODUCTION { background:#c8e6c9; color:#2e7d32 }
    .stage-APPROVED { background:#bbdefb; color:#1565c0 }
    .stage-DRAFT { background:#f5f5f5; color:#555 }
    .stage-ARCHIVED { background:#ffccbc; color:#bf360c }
  `]
})
export class ModelDetailComponent implements OnInit {
  model: MLModel | null = null;
  versions: any[] = [];
  loading = false;
  error = '';
  cols = ['version', 'stage', 'approved', 'actions'];

  constructor(private api: ApiService, private route: ActivatedRoute, private dialog: MatDialog) {}

  ngOnInit() { this.load(); }

  load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true; this.error = '';
    this.api.getModel(id).subscribe({
      next: m => {
        this.model = m;
        this.api.getVersions(id).subscribe({
          next: v => { this.versions = v; this.loading = false; },
          error: e => { this.error = 'Failed to load versions.'; this.loading = false; }
        });
      },
      error: () => { this.error = 'Model not found.'; this.loading = false; }
    });
  }

  nextStage(v: ModelVersion): string | null {
    const idx = STAGE_ORDER.indexOf(v.stage);
    return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
  }

  promote(v: any) {
    const next = this.nextStage(v); if (!next) return;
    v.promoting = true; v.stageError = '';
    this.api.updateStage(v.model_id, v.id, next).subscribe({
      next: updated => { Object.assign(v, updated); v.promoting = false; },
      error: e => { v.stageError = e.error?.detail || 'Transition failed.'; v.promoting = false; }
    });
  }

  approve(v: any) {
    v.approving = true; v.stageError = '';
    this.api.updateStage(v.model_id, v.id, v.stage, true).subscribe({
      next: updated => { Object.assign(v, updated); v.approving = false; },
      error: e => { v.stageError = e.error?.detail || 'Approval failed.'; v.approving = false; }
    });
  }

  openAddVersion() {
    this.dialog.open(CreateVersionDialogComponent, { width: '420px', data: { modelId: this.model!.id } })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }
}
