import { TestBed } from '@angular/core/testing';

import { StubFileManagerService } from './stub-file-manager.service';

describe('StubFileManagerService', () => {
  let service: StubFileManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StubFileManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
