import { TestBed, inject } from '@angular/core/testing';

import { AddtopicService } from './addtopic.service';

describe('AddtopicService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AddtopicService]
    });
  });

  it('should be created', inject([AddtopicService], (service: AddtopicService) => {
    expect(service).toBeTruthy();
  }));
});
