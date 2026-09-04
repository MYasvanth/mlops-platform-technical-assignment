import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MonitoringComponent } from './monitoring.component';

describe('MonitoringComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoringComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    const fixture = TestBed.createComponent(MonitoringComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show empty state after search with no results', () => {
    const fixture = TestBed.createComponent(MonitoringComponent);
    fixture.componentInstance.modelId = 'model-1';
    fixture.componentInstance.load();
    httpMock.expectOne('http://localhost:8000/api/v1/models/model-1/metrics').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No metrics found');
  });

  it('should show error on API failure', () => {
    const fixture = TestBed.createComponent(MonitoringComponent);
    fixture.componentInstance.modelId = 'model-1';
    fixture.componentInstance.load();
    httpMock.expectOne('http://localhost:8000/api/v1/models/model-1/metrics').error(new ErrorEvent('network error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Failed to load metrics');
  });

  it('latest should return first metric', () => {
    const fixture = TestBed.createComponent(MonitoringComponent);
    const m = { id: '1', model_id: 'x', version: '1.0', environment: 'prod', timestamp: new Date().toISOString(), latency_ms: 42 };
    fixture.componentInstance.metrics = [m as any];
    expect(fixture.componentInstance.latest).toEqual(m as any);
  });
});
