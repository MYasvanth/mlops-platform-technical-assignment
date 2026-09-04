import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ModelsComponent } from './models.component';

const API = 'http://localhost:8000/api/v1/models';

const mockModel = (id: string, name: string, owner: string, framework: string) => ({
  id, name, owner, framework, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
});

describe('ModelsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function createAndFlush(data: any[] = []) {
    const fixture = TestBed.createComponent(ModelsComponent);
    fixture.detectChanges();
    httpMock.expectOne(API).flush(data);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createAndFlush();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show empty state when no models', () => {
    const fixture = createAndFlush();
    expect(fixture.nativeElement.textContent).toContain('No models found');
  });

  it('should show model name in table', () => {
    const fixture = createAndFlush([mockModel('1', 'Test Model', 'Team A', 'pytorch')]);
    expect(fixture.nativeElement.textContent).toContain('Test Model');
  });

  it('should show error message on API failure', () => {
    const fixture = TestBed.createComponent(ModelsComponent);
    fixture.detectChanges();
    httpMock.expectOne(API).error(new ErrorEvent('network error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Failed to load models');
  });

  it('should filter models by search', () => {
    const fixture = createAndFlush([
      mockModel('1', 'Alpha', 'Team A', 'pytorch'),
      mockModel('2', 'Beta', 'Team B', 'sklearn'),
    ]);
    fixture.componentInstance.search = 'alpha';
    expect(fixture.componentInstance.filtered.length).toBe(1);
    expect(fixture.componentInstance.filtered[0].name).toBe('Alpha');
  });
});
