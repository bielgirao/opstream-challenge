# Architecture Decision Records

Short records of the decisions behind this project: what we chose, what we rejected, and why.
Format: Context → Decision → Options considered → Consequences.

| #                                                       | Decision                                                          | Status   |
| ------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| [0001](0001-scope-and-quality-bar.md)                   | Scope: full brief plus visible extras                             | Accepted |
| [0002](0002-angular-standalone-signals-rxjs.md)         | Angular 22 standalone; signals for UI state, RxJS for async flows | Accepted |
| [0003](0003-feature-based-folder-structure.md)          | Feature-based folder structure (`core` / `shared` / `features`)   | Accepted |
| [0004](0004-mock-backend-http-interceptor.md)           | Mock backend as an `HttpInterceptor`                              | Accepted |
| [0005](0005-single-request-form-group.md)               | One `FormGroup` per request, one nested group per section         | Accepted |
| [0006](0006-dynamic-field-rendering.md)                 | Field rendering with `@switch` + `ControlValueAccessor`           | Accepted |
| [0007](0007-routing-and-navigation-guard.md)            | URL-driven wizard with a forward-navigation guard                 | Accepted |
| [0008](0008-draft-restore-contract-extension.md)        | Add `GET /api/requests/:id` to restore drafts                     | Accepted |
| [0009](0009-loading-empty-error-states.md)              | Loading, empty and error states                                   | Accepted |
| [0010](0010-visual-design-mockup-plus-design-system.md) | Mockup layout + Opstream design system tokens                     | Accepted |
| [0011](0011-typography-gilroy-with-fallback.md)         | Gilroy with Figtree fallback                                      | Accepted |
| [0012](0012-written-requirements-win-over-mockups.md)   | Written requirements win over mockups                             | Accepted |
| [0013](0013-validation-rules-by-field-type.md)          | Validation rules inferred from field type, as pure functions      | Accepted |
| [0014](0014-autosave-pipeline.md)                       | Autosave pipeline: per-question lanes, `switchMap`, retry, flush  | Accepted |
