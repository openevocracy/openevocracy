import { TestBed, inject } from '@angular/core/testing';

import { TopicsListService } from './topiclist.service';

describe('TopicsListService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TopicsListService]
    });
  });

  it('should be created', inject([TopicsListService], (service: TopicsListService) => {
    expect(service).toBeTruthy();
  }));
});
