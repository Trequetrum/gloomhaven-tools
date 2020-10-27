import { TestBed } from '@angular/core/testing';

import { GooglePickerService } from './google-picker.service';

describe('GooglePickerService', () => {
  let service: GooglePickerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GooglePickerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
