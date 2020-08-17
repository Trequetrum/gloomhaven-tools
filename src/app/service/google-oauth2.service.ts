import { Injectable, NgZone } from '@angular/core';

import { Observable, Subscription, of, from, defer, throwError, Subject, BehaviorSubject, bindCallback, bindNodeCallback } from 'rxjs';
import { map, mergeMap, tap, mapTo } from 'rxjs/operators';
import { nextTick } from 'process';

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
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.appdata'
    ].join(' ');
    readonly discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

    // This flag is for both the client and auth2 api as well as client initialization
    private _apiLoaded = false;
    private _clientInit = false;

    // Should access this without first checking that isSignedIn === true
    // getCurrentOauthInstance() is almost always the better idea.
    currentOauthInstance = null;

    // Our OAuth flow should come with the scope we need. So we don't separate signin from
    // scope auth. If we start needing more scopes, we'll need a new way to handle that.
    // For now, if the user signs in and denies us the 'drive.file' scope, we just pass that 
    // error forward any time the user attempts to use those features

    // Observable that tracks sign in and sign out
    private isSignedIn$ = new BehaviorSubject<boolean>(false);
    // Observable that tracks the username. An empty string
    // means there is no user signed in (though tracking that
    // through isSignedIn$ is better)
    username$ = new BehaviorSubject<string>("");

    /**
     * ngZone Lets us re-execute in the angular zone after a google drive 
     * client call.
     */
    constructor(private ngZone: NgZone) { }

    listenSignIn(): Observable<boolean> {
        return this.isSignedIn$.asObservable();
    }
    listenUsername(): Observable<string> {
        return this.username$.asObservable();
    }

    private _loadGapiClientAuth2_bind(): Observable<boolean> {
        return bindCallback(gapi.load).call(gapi, 'client:auth2').pipe(mapTo(true));
    }

    /****
     * Emit's true once gapi.load('client:auth2') completes
     * fails if the load takes over 10 seconds
     ****/
    private _loadGapiClientAuth2(): Observable<boolean> {

        // I'd love to do this with bindNodeCallback(gapi.load)('client:auth2'), but it didn't work
        // and I don't feel like trouble shooting it right now. Making a custom observable will work 
        return new Observable<boolean>(observer => {
            let timer: any;

            if(this._apiLoaded){
                observer.next(true);
                observer.complete();
            }else{
                // Is there any way to check for failure?
                // Error out if this doesn't load after 10 seconds.
                timer = setTimeout(() => observer.error("gapi.load failure (timed out after 10 seconds)"), 10000);

                gapi.load('client:auth2', () => {
                    this._apiLoaded = true;
                    // We've loaded, no need for our timeout now
                    clearTimeout(timer);
                    observer.next(true);
                    observer.complete();
                });
            }

            return {
                unsubscribe() {
                   if(timer) clearTimeout(timer);
                }
            };
        });
    }

    /***
     * Load the google api auth2 and client libraries, then initialize the client.
     * Google-auth service will load the client if/when it needs it, so this function
     * likely never needs to be called externally.
     * 
     * If initClient() is called early to speed up later calls, make sure that GAPI
     * (Google Api "https://apis.google.com/js/api.js") is loaded first.
     */
    initGapiClient(): Observable<boolean> {
        return defer(() => of(this._clientInit)).pipe(
            mergeMap(apiLoaded => {

                if (apiLoaded) return of(true);
                if (!gapi) throw new Error("GAPI isn't loaded");

                //return this._loadGapiClientAuth2().pipe(
                return this._loadGapiClientAuth2_bind().pipe(
                    mergeMap(() => from(gapi.client.init({
                        'apiKey': this.developerKey,
                        'clientId': this.clientId,
                        'discoveryDocs': this.discoveryDocs,
                        'scope': this.scopes
                    }))),
                    map(() => {
                        // Client and auth2 api are loaded and client Api is initialized
                        this._clientInit = true;

                        // Listen for sign-in state changes.
                        gapi.auth2.getAuthInstance().isSignedIn.listen(isSignedIn => this.ngZone.run(() => this.updateSigninStatus(isSignedIn)));
                        // Handle the initial sign-in state.
                        this.ngZone.run(() => this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get()));

                        return true;
                    })
                );
            })
        );
    }

    /***
     * Tracks whether the current user is signedIn
     */
    updateSigninStatus(isSignedIn) {
        // this.isSignedIn = isSignedIn
        if (isSignedIn) {
            this.isSignedIn$.next(true);
            this.username$.next(gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getGivenName());
            this.currentOauthInstance = gapi.auth2.getAuthInstance();
        } else {
            this.isSignedIn$.next(false);
            this.username$.next("");
            this.currentOauthInstance = null;
        }
    }

    /****
     * Retrieve an Oauth Instance for the current user. Load APIs
     * and/or initialize OAuth flow if nessesary.
     */
    getOauthInstance(): Observable<any> {

        // When somebody subscribes, grab the most recent value of this.apiLoaded
        return defer(() => of(this._clientInit)).pipe(
            // Map to an auth Instance based on whether API is loaded.
            mergeMap(apiLoaded => {
                if (apiLoaded && this.isSignedIn$.getValue()) {
                    // Easiest Scenario. We're ready to go, just return an AuthInstance
                    return of(gapi.auth2.getAuthInstance());
                } else if (apiLoaded) {
                    // We're not authorized, let's try to sign in and then return 
                    // an AuthInstance
                    return from(gapi.auth2.getAuthInstance().signIn()).pipe(
                        map(() => gapi.auth2.getAuthInstance())
                    );
                } else {
                    // If we get here, that means the API isn't loaded. This should only happen
                    // the very first time this call is made. (Rd: The API is lazy loaded).
                    return this.initGapiClient().pipe(
                        // Yeah, this is a recusive call. It's fine since we're now sure the API
                        // Is loaded.
                        map(() => this.getOauthInstance())
                    );
                }
            })
        );
    }

    /***
     * Get a Google OAuth token for the current user. Calls getOauthInstance() first,
     * which starts Auth2 flow if not signedIn.
     */
    getOauthToken(): Observable<any> {
        // return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
        return this.getOauthInstance().pipe(
            map(oauthInstance => oauthInstance.currentUser.get().getAuthResponse().access_token)
        );
    }

    /***
     * Get a Google user name for the current user. Calls getOauthInstance() first,
     * which starts Auth2 flow if not signedIn.
     */
    getUserName(): Observable<string> {
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
    signOut(): void {
        // oauthInstance.signOut();
        if (this.isSignedIn$.getValue()) {
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
        if (this.isSignedIn$.getValue()) {
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
    getClient(): Observable<any> {
        return defer(() => of(this._clientInit)).pipe(
            mergeMap(isLoaded => {
                // Pass the client through if it's truthy
                if (isLoaded) {
                    return of(gapi.client);
                } else {
                    return from(this.initGapiClient()).pipe(
                        map(isInit => {
                            if (isInit) return gapi.client;
                            else throw new Error("Failed to Init Client for getClient");
                        })
                    );
                }
            })
        );
    }

}
