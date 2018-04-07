import { TestBed, inject } from '@angular/core/testing';

import { EmailModalService } from './pwforget.service';

describe('EmailModalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmailModalService]
    });
  });

  it('should be created', inject([EmailModalService], (service: EmailModalService) => {
    expect(service).toBeTruthy();
  }));
});
