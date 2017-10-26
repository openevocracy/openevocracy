import { TestBed, inject } from '@angular/core/testing';

import { GuardService } from './guard.service';

describe('GuardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuardService]
    });
  });

  it('should be created', inject([GuardService], (service: GuardService) => {
    expect(service).toBeTruthy();
  }));
});
