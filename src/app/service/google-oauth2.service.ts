import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

declare var gapi: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleOauth2Service {

  developerKey = 'AIzaSyA-vosulPclQhvWAjkpN4QVodMmwrtUC2g';
  clientId = '321669051884-gr3ctck8nouph8c3cithdte3kgp1j0iq.apps.googleusercontent.com'
  scopes = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/drive.file'
  ].join(' ');
  discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

  // This flag is for both the client and auth2 api as well as client initialization
  apiLoaded = false;
  isAuthorized = false;

  constructor() {

  }

  initClient(): Observable<boolean>{
    return new Observable<boolean>(observer => {
      // We can't cancel gapi promises, but we can supress the response if we want
      let notify = true;

      // gapi.load returns a promise. Initialize client once loaded then
      // sign in once client is initialized. 
      gapi.load('client:auth2', () => {
        // Load the client
        gapi.client.init({
          'apiKey': this.developerKey,
          'clientId': this.clientId,
          'discoveryDocs': this.discoveryDocs,
          'scope': this.scopes
        }).then(() => {
          // Client and auth2 api are loaded and client Api is initialized
          this.apiLoaded = true;

          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(isSignedIn => this.updateSigninStatus(isSignedIn));
          // Handle the initial sign-in state.
          this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          // Emit completion if not supressed
          if(notify) observer.complete();
        }, (error) => {
          // Emit error if not supressed
          if(notify) observer.error(error);
        });
      });
     
      // The subscribe() call returns a Subscription object that has an unsubscribe() 
      // method, which you call to stop receiving notifications.
      return {unsubscribe() {
        // GAPI doesn't really have 'unsubscribe,' so the best we can do is 
        // supress our observable
        notify = false;
      }};
    });
  }

  updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      this.isAuthorized = true;
    } else {
      this.isAuthorized = false;
    }
  }


  getOauthInstance(): Observable<any>{
    return new Observable<any>(observer => {

      let notify = true;
      let clientInitSubscription: Subscription;

      // OauthService fails if gapi isn't loaded
      if(!gapi){
        let errorString = "Error: GAPI isn't loaded";
        console.log(errorString);
        observer.error(errorString);
      } else if(this.apiLoaded){
        if(this.isAuthorized){
          // Easiest Scenario. We're ready to go, so just emit an AuthInstance
          if(notify){
            observer.next(gapi.auth2.getAuthInstance());
            observer.complete();
          }
        } else {
          // We're not authorized, let's try to sign in, if this promise returns
          // without error we should be safe to emit an AuthInstance
          gapi.auth2.getAuthInstance().signIn().then(() => {
            if(notify){
              observer.next(gapi.auth2.getAuthInstance());
              observer.complete();
            }
            },(error) => {
              if(notify) observer.error(error)
            }
          );
        }
      }else{
        // If we get here, that means the API isn't loaded. This should only happen
        // the very first time this call is made. (Rd: The API is lazy loaded).
        // Load the API, wait for completion, then getOauthToken again
        clientInitSubscription = this.initClient().subscribe({
          // Client is initialized. Now we make a recursive call to this function.
          // This recursive call should only be able to happen once.
          // Because this is asychonous, we solve this by subscribing to and passing 
          // along the new Observable verbatum
          complete: () => {
            this.getOauthInstance().subscribe({
              next: (oauthInstance) => observer.next(oauthInstance),
              complete: () => observer.complete(),
              error: (errorObj) => observer.error(errorObj)
            });
          },
          // Client init failed for some reason or another. We'll pass that along to the caller.
          error: (error) => observer.error()
        });
      }
      return {unsubscribe() {
        // GAPI doesn't really have 'unsubscribe,' so the best we can do is supress our observable(s)
        if(clientInitSubscription) clientInitSubscription.unsubscribe();
        notify = false;
      }};

    });
  }

  // Call to get an authInstance and then extract the token.
  getOauthToken(): Observable<any>{
    // return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token

    return new Observable<string>(observer => {
      const oauthSubscription = this.getOauthInstance().subscribe({
        next: (oauthInstance) => observer.next(oauthInstance.currentUser.get().getAuthResponse().access_token),
        complete: () => observer.complete(),
        error: (errorObj) => observer.error(errorObj)
      });

      return {unsubscribe() {
        oauthSubscription.unsubscribe();
      }};
    });
  }

  // Signs the user out of our app, but doesn't revoke our app's access
  signOut(): void{
    // oauthInstance.signOut();
    if(this.isAuthorized){
      this.getOauthInstance().subscribe({
        next: (oauthInstance) => oauthInstance.signOut(),
        error: (errorObj) => console.log(errorObj)
      });
    }
  }

  // After this is called, the user should be asked anew 
  // if they want to grant us access to the defined scopes
  revokeAccess(): void {
    // oauthInstance.disconnect();
    if(this.isAuthorized){
      this.getOauthInstance().subscribe({
        next: (oauthInstance) => oauthInstance.disconnect(),
        error: (errorObj) => console.log(errorObj)
      });
    }
  }

}
