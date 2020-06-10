import { TestBed } from '@angular/core/testing';

import { DataMemoryService } from './data-memory.service';

describe('DataMemoryService', () => {
  let service: DataMemoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataMemoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
