import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePersonalQuestComponent } from './update-personal-quest.component';

describe('UpdatePersonalQuestComponent', () => {
  let component: UpdatePersonalQuestComponent;
  let fixture: ComponentFixture<UpdatePersonalQuestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdatePersonalQuestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdatePersonalQuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
