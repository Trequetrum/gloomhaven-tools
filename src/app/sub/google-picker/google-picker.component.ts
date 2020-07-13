import { Component, OnInit } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';

declare var gapi: any;
/*
declare var google: any;
*/

@Component({
  selector: 'app-google-picker',
  templateUrl: './google-picker.component.html',
  styleUrls: ['./google-picker.component.scss']
})
export class GooglePickerComponent implements OnInit {

  pickerApiLoaded = false;

  constructor(private oauthService: GoogleOauth2Service){}

  ngOnInit(): void {
    // Use the API Loader script to load google.picker
    gapi.load('picker', this.onPickerApiLoad)
  }

  onPickerApiLoad(){
    this.pickerApiLoaded = true;
  }

  loadGooglePicker() {
    const oauthToken = this.oauthService.getOauthToken();
    console.log(">>>> LOAD CALLED");
    /*
    if (this.pickerApiLoaded && oauthToken) {
      var picker = new google.picker.PickerBuilder().
          addView(google.picker.ViewId.DOCS).
          setOAuthToken(oauthToken).
          setDeveloperKey(developerKey).
          setCallback(pickerCallback).
          build();
      picker.setVisible(true);
    }
    */
  }

  /*
  developerKey = 'AIzaSyA-vosulPclQhvWAjkpN4QVodMmwrtUC2g';
  clientId = '321669051884-gr3ctck8nouph8c3cithdte3kgp1j0iq.apps.googleusercontent.com'
  scope = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/drive.file'
  ].join(' ');
  pickerApiLoaded = false;
  oauthToken?: any;

  loadGoogleDrive() {
    gapi.load('auth', { 'callback': this.onAuthApiLoad.bind(this) });
    gapi.load('picker', { 'callback': this.onPickerApiLoad.bind(this) });
  }

  onAuthApiLoad() {
    gapi.auth.authorize(
      {
        'client_id': this.clientId,
        'scope': this.scope,
        'immediate': false
      },
      this.handleAuthResult);
  }

  onPickerApiLoad() {
    this.pickerApiLoaded = true;
  }

  handleAuthResult(authResult) {
    console.log(authResult);
    let src;
    if (authResult && !authResult.error) {
      if (authResult.access_token) {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("application/json");
        view.setQuery("gloomtools.json");
        const pickerBuilder = new google.picker.PickerBuilder();
        const picker = pickerBuilder.
          enableFeature(google.picker.Feature.NAV_HIDDEN).
          setOAuthToken(authResult.access_token).
          addView(view).
          addView(new google.picker.DocsUploadView()).
          setCallback(function (e) {
            if (e[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
              let doc = e[google.picker.Response.DOCUMENTS][0];
              src = doc[google.picker.Document.URL];
              console.log("Document selected is", doc,"and URL is ",src)
            }
          }).
          build();
        picker.setVisible(true);
      }
    }
  }
  */
}
