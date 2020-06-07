import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CharScenarioComponent } from './char-scenario.component';

describe('CharScenarioComponent', () => {
  let component: CharScenarioComponent;
  let fixture: ComponentFixture<CharScenarioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CharScenarioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CharScenarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
