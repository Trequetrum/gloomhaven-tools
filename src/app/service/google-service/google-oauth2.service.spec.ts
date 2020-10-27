import { TestBed } from '@angular/core/testing';

import { GoogleOauth2Service } from './google-oauth2.service';

describe('GoogleOauth2Service', () => {
  let service: GoogleOauth2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleOauth2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
