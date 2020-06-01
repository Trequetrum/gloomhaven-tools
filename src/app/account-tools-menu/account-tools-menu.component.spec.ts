import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountToolsMenuComponent } from './account-tools-menu.component';

describe('AccountToolsMenuComponent', () => {
  let component: AccountToolsMenuComponent;
  let fixture: ComponentFixture<AccountToolsMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountToolsMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountToolsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
