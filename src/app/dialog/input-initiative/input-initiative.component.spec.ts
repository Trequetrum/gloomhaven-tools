import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputInitiativeComponent } from './input-initiative.component';

describe('InputInitiativeComponent', () => {
  let component: InputInitiativeComponent;
  let fixture: ComponentFixture<InputInitiativeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputInitiativeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputInitiativeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
