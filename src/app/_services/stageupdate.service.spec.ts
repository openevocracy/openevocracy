import { TestBed } from '@angular/core/testing';

import { StageUpdateService } from './stageupdate.service';

describe('StageUpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StageUpdateService = TestBed.get(StageUpdateService);
    expect(service).toBeTruthy();
  });
});
