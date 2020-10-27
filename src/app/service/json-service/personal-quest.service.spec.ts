import { TestBed } from '@angular/core/testing';

import { PersonalQuestService } from './personal-quest.service';

describe('PersonalQuestService', () => {
  let service: PersonalQuestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonalQuestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
