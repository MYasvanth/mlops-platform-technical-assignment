import { Routes } from '@angular/router';
import { ModelsComponent } from './models/models.component';
import { ModelDetailComponent } from './model-detail/model-detail.component';
import { VersionCompareComponent } from './model-detail/version-compare.component';
import { DeploymentsComponent } from './deployments/deployments.component';
import { MonitoringComponent } from './monitoring/monitoring.component';

export const routes: Routes = [
  { path: '', redirectTo: 'models', pathMatch: 'full' },
  { path: 'models', component: ModelsComponent },
  { path: 'models/:id', component: ModelDetailComponent },
  { path: 'models/:id/compare', component: VersionCompareComponent },
  { path: 'deployments', component: DeploymentsComponent },
  { path: 'monitoring', component: MonitoringComponent },
];
