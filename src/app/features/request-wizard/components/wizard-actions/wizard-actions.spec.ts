import { TestBed } from '@angular/core/testing';
import { WizardActions } from './wizard-actions';

async function render(inputs: { isFirst?: boolean; isLast?: boolean; submitting?: boolean }) {
  const fixture = TestBed.createComponent(WizardActions);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  await fixture.whenStable();
  const buttons = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
  return { fixture, buttons, labels: buttons.map((b) => b.textContent?.trim()) };
}

describe('WizardActions', () => {
  it('first section: only Next', async () => {
    expect((await render({ isFirst: true })).labels).toEqual(['Next']);
  });

  it('middle section: Previous and Next', async () => {
    expect((await render({})).labels).toEqual(['Previous', 'Next']);
  });

  it('last section: Submit instead of Next', async () => {
    expect((await render({ isLast: true })).labels).toEqual(['Previous', 'Submit']);
  });

  it('the primary action submits the form; Previous does not', async () => {
    const { buttons } = await render({});
    expect(buttons.map((b) => b.type)).toEqual(['button', 'submit']);
  });

  it('emits previous', async () => {
    const { fixture, buttons } = await render({});
    let emitted = false;
    fixture.componentInstance.previous.subscribe(() => (emitted = true));
    buttons[0].click();
    expect(emitted).toBe(true);
  });

  it('shows the primary action as busy while submitting', async () => {
    const { buttons } = await render({ isLast: true, submitting: true });
    expect(buttons[1].getAttribute('aria-busy')).toBe('true');
  });
});
