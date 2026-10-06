import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItemStatus, UiNavItem } from '../../../../shared/ui';

export interface SectionNavItem {
  id: string;
  title: string;
  active: boolean;
  /** Not reachable yet: an earlier section is still invalid. */
  disabled: boolean;
  status: NavItemStatus;
}

/** Sidebar listing the request's sections, with reachability and save status per section. */
@Component({
  selector: 'app-section-nav',
  imports: [RouterLink, UiNavItem],
  templateUrl: './section-nav.html',
  styleUrl: './section-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionNav {
  readonly requestId = input.required<string>();
  readonly items = input.required<readonly SectionNavItem[]>();
}
