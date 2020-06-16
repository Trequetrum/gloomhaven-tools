import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectLpAchieveChipComponent } from './select-lp-achieve-chip.component';

describe('SelectLpAchieveChipComponent', () => {
  let component: SelectLpAchieveChipComponent;
  let fixture: ComponentFixture<SelectLpAchieveChipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectLpAchieveChipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectLpAchieveChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
