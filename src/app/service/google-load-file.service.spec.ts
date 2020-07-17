import { TestBed } from '@angular/core/testing';

import { GoogleLoadFileService } from './google-load-file.service';

describe('GoogleLoadFileService', () => {
  let service: GoogleLoadFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleLoadFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
