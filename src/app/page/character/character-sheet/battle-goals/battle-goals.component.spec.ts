import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleGoalsComponent } from './battle-goals.component';

describe('BattleGoalsComponent', () => {
  let component: BattleGoalsComponent;
  let fixture: ComponentFixture<BattleGoalsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BattleGoalsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BattleGoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
