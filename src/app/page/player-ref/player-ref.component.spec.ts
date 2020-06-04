import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerRefComponent } from './player-ref.component';

describe('PlayerRefComponent', () => {
  let component: PlayerRefComponent;
  let fixture: ComponentFixture<PlayerRefComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerRefComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerRefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
