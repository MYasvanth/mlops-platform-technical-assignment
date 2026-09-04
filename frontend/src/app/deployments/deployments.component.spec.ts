import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DeploymentsComponent } from './deployments.component';

const API = 'http://localhost:8000/api/v1/deployments';

describe('DeploymentsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function createAndFlush(data: any[] = []) {
    const fixture = TestBed.createComponent(DeploymentsComponent);
    fixture.detectChanges();
    httpMock.expectOne(API).flush(data);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createAndFlush();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show empty state when no deployments', () => {
    const fixture = createAndFlush();
    expect(fixture.nativeElement.textContent).toContain('No deployments yet');
  });

  it('should show error on API failure', () => {
    const fixture = TestBed.createComponent(DeploymentsComponent);
    fixture.detectChanges();
    httpMock.expectOne(API).error(new ErrorEvent('network error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Failed to load deployments');
  });

  it('should require model_id and version_id before deploying', () => {
    const fixture = createAndFlush();
    fixture.componentInstance.deploy();
    expect(fixture.componentInstance.createError).toContain('required');
  });
});
