import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-create-model-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule],
  template: `
    <h2 mat-dialog-title>Register Model</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name *</mat-label>
        <input matInput [(ngModel)]="name">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Owner *</mat-label>
        <input matInput [(ngModel)]="owner">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Framework *</mat-label>
        <input matInput [(ngModel)]="framework" placeholder="e.g. scikit-learn, pytorch">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <input matInput [(ngModel)]="description">
      </mat-form-field>
      <div *ngIf="error" class="error-msg">{{ error }}</div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="saving">
        {{ saving ? 'Saving...' : 'Register' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width:100%; margin-bottom:8px } .error-msg { color:#f44336 }`]
})
export class CreateModelDialogComponent {
  name = ''; owner = ''; framework = ''; description = '';
  saving = false; error = '';

  constructor(private api: ApiService, private ref: MatDialogRef<CreateModelDialogComponent>) {}

  submit() {
    if (!this.name || !this.owner || !this.framework) { this.error = 'Name, owner and framework are required.'; return; }
    this.saving = true; this.error = '';
    this.api.createModel({ name: this.name, owner: this.owner, framework: this.framework, description: this.description }).subscribe({
      next: () => this.ref.close(true),
      error: e => { this.error = e.error?.detail || 'Failed to create model.'; this.saving = false; }
    });
  }
}
