import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectPersonalQuestComponent } from './select-personal-quest.component';

describe('SelectPersonalQuestComponent', () => {
  let component: SelectPersonalQuestComponent;
  let fixture: ComponentFixture<SelectPersonalQuestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectPersonalQuestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPersonalQuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
