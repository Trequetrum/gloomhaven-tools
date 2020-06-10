import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CharSelectorComponent } from './char-selector.component';

describe('CharSelectorComponent', () => {
  let component: CharSelectorComponent;
  let fixture: ComponentFixture<CharSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CharSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CharSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
