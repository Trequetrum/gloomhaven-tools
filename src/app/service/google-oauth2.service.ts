import { Injectable } from '@angular/core';

declare var gapi: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleOauth2Service {

  developerKey = 'AIzaSyA-vosulPclQhvWAjkpN4QVodMmwrtUC2g';
  clientId = '321669051884-gr3ctck8nouph8c3cithdte3kgp1j0iq.apps.googleusercontent.com'
  scope = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/drive.file'
  ].join(' ');
  discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];


  apiLoaded = false;
  isAuthorized = false;
  googleAuth: any; // Google Auth object.

  constructor() {
  }

  initClient() {
    gapi.client.init({
        'apiKey': this.developerKey,
        'clientId': this.clientId,
        'scope': this.scope,
        'discoveryDocs': this.discoveryDocs
      }).then(function () {
        this.googleAuth = gapi.auth2.getAuthInstance();

        // Listen for sign-in state changes.
        this.googleAuth.isSignedIn.listen(this.updateSigninStatus);

        this.apiLoaded = true;
    });
  }

  updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      this.isAuthorized = true;
    } else {
      this.isAuthorized = false;
    }
  }

  getOauthToken(): any{
    if(this.apiLoaded){
      if(this.isAuthorized){
        console.log("googleAuth Object: ", this.googleAuth);
      }else{
        this.googleAuth.signIn();
      }
    }else{
      console.log("ERROR: Google OAuth API failed to load");
      this.initClient();
    }

    return null;
  }
}
