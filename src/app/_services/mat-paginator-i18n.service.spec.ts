import { TestBed } from '@angular/core/testing';

import { MatPaginatorI18nService } from './mat-paginator-i18n.service';

describe('MatPaginatorI18nService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MatPaginatorI18nService = TestBed.get(MatPaginatorI18nService);
    expect(service).toBeTruthy();
  });
});
