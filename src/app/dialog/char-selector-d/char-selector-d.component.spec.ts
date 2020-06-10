import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CharSelectorDComponent } from './char-selector-d.component';

describe('CharSelectorDComponent', () => {
  let component: CharSelectorDComponent;
  let fixture: ComponentFixture<CharSelectorDComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CharSelectorDComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CharSelectorDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
