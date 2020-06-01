import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicToolsMenuComponent } from './public-tools-menu.component';

describe('PublicToolsMenuComponent', () => {
  let component: PublicToolsMenuComponent;
  let fixture: ComponentFixture<PublicToolsMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicToolsMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicToolsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
