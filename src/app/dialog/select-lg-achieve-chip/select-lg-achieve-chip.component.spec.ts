import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectLgAchieveChipComponent } from './select-lg-achieve-chip.component';

describe('SelectLgAchieveChipComponent', () => {
  let component: SelectLgAchieveChipComponent;
  let fixture: ComponentFixture<SelectLgAchieveChipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectLgAchieveChipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectLgAchieveChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
