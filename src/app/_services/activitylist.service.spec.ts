import { TestBed, inject } from '@angular/core/testing';

import { ActivityListService } from './activitylist.service';

describe('ActivityListService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActivityListService]
    });
  });

  it('should be created', inject([ActivityListService], (service: ActivityListService) => {
    expect(service).toBeTruthy();
  }));
});
