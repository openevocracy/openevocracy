import { TestBed, inject } from '@angular/core/testing';

import { ConnectionAliveService } from './connection.service';

describe('ConnectionAliveService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectionAliveService]
    });
  });

  it('should be created', inject([ConnectionAliveService], (service: ConnectionAliveService) => {
    expect(service).toBeTruthy();
  }));
});
