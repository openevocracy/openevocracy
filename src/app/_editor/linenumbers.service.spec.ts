import { TestBed } from '@angular/core/testing';

import { LineNumbersService } from './linenumbers.service';

describe('LineNumbersService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LineNumbersService = TestBed.get(LineNumbersService);
    expect(service).toBeTruthy();
  });
});
