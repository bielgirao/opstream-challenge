import { TestBed } from '@angular/core/testing';
import { NotificationType, UiNotification } from './notification';

describe('UiNotification', () => {
  const roleFor = async (type: NotificationType) => {
    const fixture = TestBed.createComponent(UiNotification);
    fixture.componentRef.setInput('type', type);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).getAttribute('role');
  };

  it('interrupts for errors and warnings', async () => {
    expect(await roleFor('error')).toBe('alert');
    expect(await roleFor('warning')).toBe('alert');
  });

  it('is announced politely otherwise', async () => {
    expect(await roleFor('info')).toBe('status');
    expect(await roleFor('success')).toBe('status');
    expect(await roleFor('neutral')).toBe('status');
  });
});
