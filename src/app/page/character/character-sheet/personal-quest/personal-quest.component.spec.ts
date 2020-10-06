import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalQuestComponent } from './personal-quest.component';

describe('PersonalQuestComponent', () => {
  let component: PersonalQuestComponent;
  let fixture: ComponentFixture<PersonalQuestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PersonalQuestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalQuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
