import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupStringsComponent } from './popup-strings.component';

describe('PopupStringsComponent', () => {
  let component: PopupStringsComponent;
  let fixture: ComponentFixture<PopupStringsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupStringsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupStringsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
