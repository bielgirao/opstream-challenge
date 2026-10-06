import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Shape =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number };

// Inline stroke icons in the style of Unicons (the design system's icon set).
// Kept as data instead of SVG strings so they render without bypassing Angular's sanitizer.
const ICONS = {
  'angle-down': [{ kind: 'path', d: 'm6 9 6 6 6-6' }],
  check: [{ kind: 'path', d: 'M20 6 9 17l-5-5' }],
  'check-circle': [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'm8 12.5 2.5 2.5L16 9.5' },
  ],
  'alert-circle': [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M12 7.5v5.5M12 16.5h.01' },
  ],
  info: [
    { kind: 'circle', cx: 12, cy: 12, r: 9 },
    { kind: 'path', d: 'M12 16.5V11M12 7.5h.01' },
  ],
  plus: [{ kind: 'path', d: 'M12 5v14M5 12h14' }],
  close: [{ kind: 'path', d: 'M18 6 6 18M6 6l12 12' }],
  redo: [{ kind: 'path', d: 'M20 12a8 8 0 1 1-2.34-5.66L20 8.5M20 4v4.5h-4.5' }],
  apps: [
    { kind: 'rect', x: 3.5, y: 3.5, width: 7, height: 7, rx: 1.5 },
    { kind: 'rect', x: 13.5, y: 3.5, width: 7, height: 7, rx: 1.5 },
    { kind: 'rect', x: 3.5, y: 13.5, width: 7, height: 7, rx: 1.5 },
    { kind: 'rect', x: 13.5, y: 13.5, width: 7, height: 7, rx: 1.5 },
  ],
  desktop: [
    { kind: 'rect', x: 2.5, y: 3.5, width: 19, height: 13, rx: 2 },
    { kind: 'path', d: 'M8 20.5h8M12 16.5v4' },
  ],
} satisfies Record<string, readonly Shape[]>;

export type IconName = keyof typeof ICONS;

/** Decorative icon. Always aria-hidden: meaning must come from adjacent text. */
@Component({
  selector: 'ui-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.--icon-size]': "size() + 'px'",
  },
})
export class UiIcon {
  readonly name = input.required<IconName>();
  readonly size = input(16);

  protected readonly shapes = computed<readonly Shape[]>(() => ICONS[this.name()]);
}
