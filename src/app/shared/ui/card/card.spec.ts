import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiCard } from './card';

@Component({
  imports: [UiCard],
  template: `<ui-card><h1>What do you need to purchase?</h1></ui-card>`,
})
class Host {}

describe('UiCard', () => {
  it('projects its content', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('ui-card h1')?.textContent).toBe(
      'What do you need to purchase?',
    );
  });
});
