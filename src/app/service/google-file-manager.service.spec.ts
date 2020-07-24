import { TestBed } from '@angular/core/testing';

import { GoogleFileManagerService } from './google-file-manager.service';

describe('GoogleFileManagerService', () => {
  let service: GoogleFileManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleFileManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
