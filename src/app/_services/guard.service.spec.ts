import { TestBed, inject } from '@angular/core/testing';

import { Guard } from './guard.service';

describe('Guard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Guard]
    });
  });

  it('should be created', inject([Guard], (service: Guard) => {
    expect(service).toBeTruthy();
  }));
});
