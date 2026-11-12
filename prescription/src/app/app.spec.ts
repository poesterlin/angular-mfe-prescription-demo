import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App (Standalone Harness)', () => {
  it('shows the standalone banner', async () => {
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const banner = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(banner?.textContent).toContain('Standalone mode');
  });
});
