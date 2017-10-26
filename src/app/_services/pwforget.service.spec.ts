import { TestBed, inject } from '@angular/core/testing';

import { PwforgetService } from './pwforget.service';

describe('PwforgetService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PwforgetService]
    });
  });

  it('should be created', inject([PwforgetService], (service: PwforgetService) => {
    expect(service).toBeTruthy();
  }));
});
