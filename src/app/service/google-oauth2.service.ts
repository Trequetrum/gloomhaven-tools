import { Injectable, NgZone } from '@angular/core';

import { Observable, Subscription, of, from, defer, throwError, Subject } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

declare var gapi: any;


/***
 * Handle user authentication with google drive. Also handle gapi.client loading and initialisation.
 * We push these two conserns together since we already really care about authentication in order 
 * to get access to gapi.client (and some minimal user info).
 * 
 * Not super happy with my use of Observables here. Was just messing around with them at the time.
 * Idealy, we shouldn't be subscribing if it's possible to reply on data transformation instead.
 * This class subscribes early, which isn't as ideal.
 * 
 * I really should re-write this, but it's an estetic rather than performance issue (as far as I can
 * tell), so it stays as is for now
 ***/
@Injectable({
  providedIn: 'root'
})
export class GoogleOauth2Service {

  readonly developerKey = 'AIzaSyA-vosulPclQhvWAjkpN4QVodMmwrtUC2g';
  readonly clientId = '321669051884-gr3ctck8nouph8c3cithdte3kgp1j0iq.apps.googleusercontent.com';
  readonly appId = "321669051884";
  readonly scopes = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/drive.file'
  ].join(' ');
  readonly discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

  // This flag is for both the client and auth2 api as well as client initialization
  apiLoaded = false;

  // Should access this without first checking that isSignedIn === true
  // getCurrentOauthInstance() is almost always the better idea.
  currentOauthInstance = null;

  // Our OAuth flow should come with the scope we need. So we don't separate signin from
  // scope auth. If we start needing more scopes, we'll need a new way to handle that.
  // For now, if the user signs in and denies us the 'drive.file' scope, we just pass that 
  // error forward any time the user attempts to use those features
  isSignedIn = false;
  // Observable that tracks sign in and sign out
  isSignedIn$ = new Subject<boolean>();

  // currentUserName gets updated as user signs in and signs out.
  currentUserName = "";

  /**
   * ngZone Lets us re-execute in the angular zone after a google drive 
   * client call.
   */
  constructor(private ngZone: NgZone) {}

  listenSignIn(): Observable<boolean>{
    return this.isSignedIn$.asObservable();
  }

  /***
   * Load the google api auth2 and client libraries, then initialize the client.
   * Google-auth service will load the client if/when it needs it, so this function
   * likely never needs to be called externally.
   * 
   * If initClient() is called early to speed up later calls, make sure that GAPI
   * (Google Api "https://apis.google.com/js/api.js") is loaded first.
   */
  initClient(): Observable<boolean>{
    return new Observable<boolean>(observer => {
      // We can't cancel gapi promises, but we can supress the response if we want
      let notify = true;

      if(this.apiLoaded){
        observer.next(true);
        observer.complete();
      }else{
        // loading libraries fails if gapi isn't loaded
        if(!gapi){
          let errorString = "Error: GAPI isn't loaded";
          console.error(errorString);
          observer.error(errorString);
        }else{
          // gapi.load returns a promise. Initialize client once loaded
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
              gapi.auth2.getAuthInstance().isSignedIn.listen(isSignedIn => this.ngZone.run(()=>this.updateSigninStatus(isSignedIn)));
              // Handle the initial sign-in state.
              this.ngZone.run(() => this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get()));
              // Emit completion if not supressed
              if(notify) {
                observer.next(true);
                observer.complete();
              }
            }).catch(error => {
              // Emit error if not supressed
              if(notify) observer.error(error);
            });
          });
        }
      }
      // The subscribe() call returns a Subscription object that has an unsubscribe() 
      // method, which you call to stop receiving notifications.
      return {unsubscribe() {
        // GAPI doesn't really have 'unsubscribe,' so the best we can do is 
        // supress our observable
        notify = false;
      }};
    });
  }

  /***
   * Tracks whether the current user is signedIn
   */
  updateSigninStatus(isSignedIn) {
    // this.isSignedIn = isSignedIn
    if (isSignedIn) {
      this.isSignedIn = true;
      this.isSignedIn$.next(true);
      this.currentUserName = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getGivenName();
      this.currentOauthInstance = gapi.auth2.getAuthInstance();
    } else {
      this.isSignedIn = false;
      this.isSignedIn$.next(false);
      this.currentUserName = "";
      this.currentOauthInstance = null;
    }
  }

  /****
   * Retrieve an Oauth Instance for the current user. Load APIs
   * and/or initialize OAuth flow if nessesary.
   */
  getOauthInstance(): Observable<any>{
    return new Observable<any>(observer => {
      let notify = true;
      let clientInitSubscription: Subscription;

      if(this.apiLoaded){
        if(this.isSignedIn){
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
              this.ngZone.run(()=>{
                observer.next(gapi.auth2.getAuthInstance());
                observer.complete();
              });
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
        // GAPI doesn't really have 'unsubscribe,' so the best we can do is supress our observable
        if(clientInitSubscription) clientInitSubscription.unsubscribe();
        notify = false;
      }};

    });
  }

  /***
   * Get a Google OAuth token for the current user. Calls getOauthInstance() first,
   * which starts Auth2 flow if not signedIn.
   */
  getOauthToken(): Observable<any>{
    // return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
    return this.getOauthInstance().pipe(
      map(oauthInstance => oauthInstance.currentUser.get().getAuthResponse().access_token)
    );
  }

  /***
   * Get a Google user name for the current user. Calls getOauthInstance() first,
   * which starts Auth2 flow if not signedIn.
   */
  getUserName(): Observable<string>{
    // return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getGivenName()
    return this.getOauthInstance().pipe(
      map(oauthInstance => oauthInstance.currentUser.get().getBasicProfile().getGivenName())
    );
  }

  /***
   * If the user is signed in, then signs the user out of our app. 
   * This doesn't revoke our app's access, which should remain the
   * next time this user opts to log in.
   */ 
  signOut(): void{
    // oauthInstance.signOut();
    if(this.isSignedIn){
      this.getOauthInstance().subscribe({
        next: oauthInstance => oauthInstance.signOut(),
        error: console.error
      });
    }
  }

  /***
   * If the user is signed in, then this signs the user out of our app. 
   * This also revoke our app's access. The user should be asked anew 
   * if they want to grant us access to the defined scopes.
   * 
   * User can do this for themselves via their google account, so this
   * may be a 'feature' relegated to development and for testing.
   */ 
  revokeAccess(): void {
    // oauthInstance.disconnect();
    if(this.isSignedIn){
      this.getOauthInstance().subscribe({
        next: oauthInstance => oauthInstance.disconnect(),
        error: console.error
      });
    }
  }

  /***
   * Return gapi.client. This may be asynconous if the service still
   * needs to initialise the client. 
   ***/
  getClient(): Observable<any>{
    return defer(()=>of(this.apiLoaded)).pipe(
      mergeMap(isLoaded => {
        // Pass the client through if it's truthy
        if(isLoaded){
          return of(gapi.client);
        }else{
          return from(this.initClient()).pipe(
            map(isInit => {
              if(isInit) return gapi.client;
              else throwError("Failed to Init Client for getClient");
            })
          );
        }
      })
    );
  }

}
