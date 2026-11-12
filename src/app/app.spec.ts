import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({ template: '<p>healthy page</p>' })
class HealthyPage {}

@Component({ template: '{{ explode() }}' })
class CrashingPage {
  protected explode(): string {
    throw new Error('render failure');
  }
}

describe('App error boundary', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'ok', component: HealthyPage },
          { path: 'crash', component: CrashingPage },
        ]),
      ],
    });
  });

  it('renders the routed page when nothing fails', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/ok');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('healthy page');
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows the alert when a routed page crashes while rendering', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/crash');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('This page stopped working');
  });
});
