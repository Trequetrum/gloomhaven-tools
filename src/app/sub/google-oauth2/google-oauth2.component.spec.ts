import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleOauth2Component } from './google-oauth2.component';

describe('GoogleOauth2Component', () => {
  let component: GoogleOauth2Component;
  let fixture: ComponentFixture<GoogleOauth2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GoogleOauth2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleOauth2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
