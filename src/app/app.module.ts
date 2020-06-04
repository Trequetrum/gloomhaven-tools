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

import { AppRoutingModule }         from './app-routing.module';
import { AppComponent }             from './app.component';
import { HeaderComponent }          from './header/header.component';
import { HomepageComponent }        from './page/home-page/home-page.component';
import { PageNotFoundComponent }    from './page/page-not-found/page-not-found.component';
import { CampaignComponent }        from './page/campaign/campaign.component';
import { InputInitiativeComponent } from './dialog/input-initiative/input-initiative.component';
import { LogInComponent }           from './dialog/log-in/log-in.component';
import { PlayerRefComponent } from './page/player-ref/player-ref.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomepageComponent,
    PageNotFoundComponent,
    CampaignComponent,
    InputInitiativeComponent,
    LogInComponent,
    PlayerRefComponent
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
    MatInputModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [
    InputInitiativeComponent,
    LogInComponent
  ]
})
export class AppModule { }

