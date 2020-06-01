import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { PublicToolsMenuComponent } from './public-tools-menu/public-tools-menu.component';
import { AccountToolsMenuComponent } from './account-tools-menu/account-tools-menu.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    PublicToolsMenuComponent,
    AccountToolsMenuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
