import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectChiplistDialogComponent } from './select-chiplist-dialog.component';

describe('SelectChiplistDialogComponent', () => {
  let component: SelectChiplistDialogComponent;
  let fixture: ComponentFixture<SelectChiplistDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectChiplistDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectChiplistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
