import { TestBed, inject } from '@angular/core/testing';

import { CloseeditorModalService } from './pwforget.service';

describe('CloseeditorModalService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CloseeditorModalService]
    });
  });

  it('should be created', inject([CloseeditorModalService], (service: CloseeditorModalService) => {
    expect(service).toBeTruthy();
  }));
});
