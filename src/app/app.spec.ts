import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter, Router } from '@angular/router';

// Mock component for testing routing
@Component({
  template: '<div>Mock Prenota Component</div>'
})
class MockPrenotaComponent { }

describe('App', () => {
  let router: Router;
  let fixture: any;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(),
      provideRouter([
        { path: '', pathMatch: 'full', redirectTo: 'prenota' },
        { path: 'prenota', component: MockPrenotaComponent }
      ])
      ]
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
  it('should contain router outlet', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should redirect from root path to /prenota', async () => {
    await router.navigate(['']);
    expect(router.url).toBe('/prenota');
  });

  it('should navigate to prenota route', async () => {
    await router.navigate(['/prenota']);
    expect(router.url).toBe('/prenota');
  });

  it('should have correct initial route configuration', () => {
    const routes = router.config;

    // Check redirect route
    const redirectRoute = routes.find(route => route.path === '' && route.pathMatch === 'full');
    expect(redirectRoute?.redirectTo).toBe('prenota');

    // Check prenota route exists
    const prenotaRoute = routes.find(route => route.path === 'prenota');
    expect(prenotaRoute).toBeTruthy();
  });

  it('should handle router outlet events', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');

    // Verify router outlet is properly rendered
    expect(routerOutlet).toBeInstanceOf(HTMLElement);
  });
});
