import { TestBed } from '@angular/core/testing';

import { DataRestapiService } from './data-restapi.service';

describe('DataRestapiService', () => {
  let service: DataRestapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataRestapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
