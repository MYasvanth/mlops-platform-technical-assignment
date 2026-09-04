import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-create-version-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule],
  template: `
    <h2 mat-dialog-title>Add Version</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Version *</mat-label>
        <input matInput [(ngModel)]="version" placeholder="e.g. 1.0.0">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Artifact URI</mat-label>
        <input matInput [(ngModel)]="artifact_uri" placeholder="s3://bucket/path">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Training Data Ref</mat-label>
        <input matInput [(ngModel)]="training_data_ref">
      </mat-form-field>
      <div *ngIf="error" class="error-msg">{{ error }}</div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="saving">
        {{ saving ? 'Saving...' : 'Add' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width:100%; margin-bottom:8px } .error-msg { color:#f44336 }`]
})
export class CreateVersionDialogComponent {
  version = ''; artifact_uri = ''; training_data_ref = '';
  saving = false; error = '';

  constructor(
    private api: ApiService,
    private ref: MatDialogRef<CreateVersionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modelId: string }
  ) {}

  submit() {
    if (!this.version) { this.error = 'Version is required.'; return; }
    this.saving = true; this.error = '';
    this.api.createVersion(this.data.modelId, { version: this.version, artifact_uri: this.artifact_uri, training_data_ref: this.training_data_ref }).subscribe({
      next: () => this.ref.close(true),
      error: e => { this.error = e.error?.detail || 'Failed to add version.'; this.saving = false; }
    });
  }
}
