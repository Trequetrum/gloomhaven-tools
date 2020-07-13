import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BrowserAnimationsModule }  from '@angular/platform-browser/animations';
import { LayoutModule }             from '@angular/cdk/layout';
import { MatToolbarModule }         from '@angular/material/toolbar';
import { MatTabsModule }            from '@angular/material/tabs';
import { MatMenuModule }            from '@angular/material/menu';
import { MatButtonModule }          from '@angular/material/button';
import { MatSidenavModule }         from '@angular/material/sidenav';
import { MatIconModule }            from '@angular/material/icon';
import { MatListModule }            from '@angular/material/list';
import { MatDialogModule }          from '@angular/material/dialog';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatChipsModule }           from '@angular/material/chips';
import { MatExpansionModule }       from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 

import { AppRoutingModule }         from './app-routing.module';
import { AppComponent }             from './app.component';
import { HeaderComponent }          from './header/header.component';
import { HomepageComponent }        from './page/home-page/home-page.component';
import { PageNotFoundComponent }    from './page/page-not-found/page-not-found.component';
import { InputInitiativeComponent } from './dialog/input-initiative/input-initiative.component';
import { LogInComponent }           from './dialog/log-in/log-in.component';
import { PlayerRefComponent } from './page/player-ref/player-ref.component';
import { CharScenarioComponent } from './page/char-scenario/char-scenario.component';
import { CharSelectorComponent } from './sub/char-selector/char-selector.component';
import { PartyComponent } from './page/party/party.component';
import { CharacterComponent } from './page/character/character.component';
import { SelectChiplistDialogComponent } from './dialog/select-chiplist-dialog/select-chiplist-dialog.component';
import { GooglePickerComponent } from './sub/google-picker/google-picker.component';
import { GoogleOauth2Component } from './sub/google-oauth2/google-oauth2.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomepageComponent,
    PageNotFoundComponent,
    InputInitiativeComponent,
    LogInComponent,
    PlayerRefComponent,
    CharScenarioComponent,
    CharSelectorComponent,
    PartyComponent,
    CharacterComponent,
    SelectChiplistDialogComponent,
    GooglePickerComponent,
    GoogleOauth2Component
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LayoutModule,

    MatToolbarModule,
    MatTabsModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule
    
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [
    InputInitiativeComponent,
    LogInComponent
  ]
})
export class AppModule { }

