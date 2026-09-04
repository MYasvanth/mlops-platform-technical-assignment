import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

const BASE = 'http://localhost:8000/api/v1';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getModels should GET /models', () => {
    service.getModels().subscribe(res => expect(res).toEqual([]));
    httpMock.expectOne(`${BASE}/models`).flush([]);
  });

  it('getModel should GET /models/:id', () => {
    service.getModel('m1').subscribe(res => expect(res).toBeTruthy());
    const req = httpMock.expectOne(`${BASE}/models/m1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'm1' });
  });

  it('createModel should POST /models', () => {
    service.createModel({ name: 'X', owner: 'O', framework: 'pytorch' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/models`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getVersions should GET /models/:id/versions', () => {
    service.getVersions('m1').subscribe(res => expect(res).toEqual([]));
    const req = httpMock.expectOne(`${BASE}/models/m1/versions`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createVersion should POST /models/:id/versions', () => {
    service.createVersion('m1', { version: '1.0.0' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/models/m1/versions`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updateStage should PATCH stage endpoint', () => {
    service.updateStage('m1', 'v1', 'VALIDATED').subscribe();
    const req = httpMock.expectOne(`${BASE}/models/m1/versions/v1/stage`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ stage: 'VALIDATED', approved: undefined });
    req.flush({});
  });

  it('getDeployments should GET /deployments', () => {
    service.getDeployments().subscribe(res => expect(res).toEqual([]));
    const req = httpMock.expectOne(`${BASE}/deployments`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createDeployment should POST /deployments', () => {
    service.createDeployment({ model_id: 'm1', version_id: 'v1', environment: 'staging' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/deployments`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('retryDeployment should POST /deployments/:id/retry', () => {
    service.retryDeployment('d1').subscribe();
    const req = httpMock.expectOne(`${BASE}/deployments/d1/retry`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('rollbackDeployment should POST /deployments/:id/rollback', () => {
    service.rollbackDeployment('d1').subscribe();
    const req = httpMock.expectOne(`${BASE}/deployments/d1/rollback`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getMetrics should GET /models/:id/metrics', () => {
    service.getMetrics('m1').subscribe(res => expect(res).toEqual([]));
    const req = httpMock.expectOne(`${BASE}/models/m1/metrics`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('compareVersions should GET /models/:id/versions/compare with query params', () => {
    service.compareVersions('m1', 'v1', 'v2').subscribe(res => expect(res).toEqual([]));
    const req = httpMock.expectOne(`${BASE}/models/m1/versions/compare?v1=v1&v2=v2`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
