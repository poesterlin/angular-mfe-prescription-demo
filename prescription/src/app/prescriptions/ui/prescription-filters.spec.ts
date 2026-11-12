import { TestBed } from '@angular/core/testing';
import { DEFAULT_QUERY } from '../model/query-defaults';
import { PrescriptionFilters } from './prescription-filters';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('PrescriptionFilters', () => {
  it('AC-Q1 keeps a keystroke typed while the URL echo of the previous search is in flight', async () => {
    const fixture = TestBed.createComponent(PrescriptionFilters);
    fixture.componentRef.setInput('query', DEFAULT_QUERY);
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.searchChange.subscribe((text) => emitted.push(text));
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    await wait(400);
    expect(emitted).toEqual(['a']);

    // The user keeps typing before the parent has navigated to ?q=a.
    input.value = 'ab';
    input.dispatchEvent(new Event('input'));

    // The URL echo for the first search arrives now.
    fixture.componentRef.setInput('query', { ...DEFAULT_QUERY, q: 'a' });
    fixture.detectChanges();
    expect(input.value).toBe('ab');

    await wait(400);
    expect(emitted).toEqual(['a', 'ab']);
  });
});
