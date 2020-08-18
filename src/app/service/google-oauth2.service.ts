import { Injectable, NgZone } from '@angular/core';

import { Observable, of, from, BehaviorSubject, bindCallback, combineLatest } from 'rxjs';
import { map, mergeMap, tap, mapTo, timeout, take } from 'rxjs/operators';

declare var gapi: any;

/***
 * Handle user authentication with google drive. Also handle gapi.client loading and initialisation.
 * We push these two conserns together since we already really care about authentication in order 
 * to get access to gapi.client (and some minimal user info).
 * 
 * Our OAuth flow should come with the scope we need. So we don't separate signin from
 * scope auth. If we start needing more scopes, we'll need a new way to handle that.
 * For now, if the user signs in and denies us the 'drive.file' scope, we just pass that 
 * error forward any time the user attempts to use those features
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
    readonly gapiScriptSrcUrl = "https://apis.google.com/js/api.js";

    // This flag is for when the google api (GAPI) is loaded
    private _apiLoaded = false;
    // This flag is for gapi.load('client:auth2')
    private _clientAuth2Loaded = false;
    // This flag is for client initialization so we're sure to only initialise once
    private _clientInit = false;

    // Observable that tracks sign in and sign out
    private _isSignedIn$ = new BehaviorSubject<boolean>(false);
    // Observable that tracks the username. An empty string
    // means there is no user signed in (though tracking that
    // through isSignedIn$ is better)
    private _username$ = new BehaviorSubject<string>("");

    // Should access this without first checking that isSignedIn$.value === true
    // getCurrentOauthInstance() is almost always the better idea.
    currentOauthInstance = null;

    /****
     * ngZone Lets us re-execute in the angular zone after a google drive 
     * client call.
     ****/
    constructor(private ngZone: NgZone) { }

    listenSignIn(): Observable<boolean> {
        return this._isSignedIn$.asObservable();
    }
    listenUsername(): Observable<string> {
        return this._username$.asObservable();
    }

    /****
     * Loads this._GapiScriptSrcUrl
     * 
     * Only successfully loads once. Subsequent calls return 
     * true immediately.
     */
    private _loadGapiScript(): Observable<boolean> {
        
        return new Observable<boolean>(observer => {
            let suppress = false;

            if (this._apiLoaded && !suppress) {
                observer.next(true);
                observer.complete();
            } else if (!this._apiLoaded) {

                // inject into the DOM
                // <script src="https://apis.google.com/js/api.js"></script>

                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = this.gapiScriptSrcUrl;
                script.onload = () => {
                    this._apiLoaded = true;
                    if (!suppress) {
                        observer.next(true);
                        observer.complete();
                    }
                };
                script.onerror = error => {
                    if (!suppress) observer.error(error);
                };
                document.getElementsByTagName('head')[0].appendChild(script);
            }

            return {
                unsubscribe: () => suppress = true  
            };
        });
    }

    /****
     * Emits true once gapi.load('client:auth2') completes
     * 
     * Only ever successfully loads the client once. Subsequent calls 
     * return true immediately.
     ****/
    private _loadGapiClientAuth2(): Observable<boolean> {
        return this._loadGapiScript().pipe(
            mergeMap(() => {
                if (this._clientAuth2Loaded) return of(true);

                return new Observable<boolean>(observer => {
                    const good = () => {
                        observer.next(true);
                        observer.complete();
                    }
                    gapi.load('client:auth2', {
                        callback: good,
                        onerror: err => observer.error(err),
                        timeout: 1000, // 5 seconds.
                        ontimeout: () => observer.error("gapi.load timeout")
                    })
                    return { unsubscribe: () => {/* Do Nothing */ } }
                });
            })
        );
    }

    /****
     * Emits true once gapi.load('client:auth2') completes
     * This fails if the load takes over 5 seconds because I'm
     * not sure of any other way to check if the load fails.
     * 
     * Only ever successfully loads the client once. Subsequent calls 
     * return true immediately.
     * 
     * This is the old version of this function call. Keeping it around
     * as an example of how to use Observable 'bindCallback'
     ****/
    private _loadGapiClientAuth2_old(): Observable<boolean> {
        return this._loadGapiScript().pipe(
            mergeMap(() => {
                if (this._clientAuth2Loaded) return of(true);

                return bindCallback(gapi.load).call(gapi, 'client:auth2').pipe(
                    timeout(5000),
                    tap(() => this._clientAuth2Loaded = true),
                    mapTo(true)
                ) as Observable<boolean>;
            })
        );
    }

    /***
     * Initialize the GAPI client.
     * 
     * Only ever successfully loads the client once. Subsequent calls 
     * return true immediately. This means you can only set the API key
     * (etc) once.
     */
    initGapiClient(): Observable<boolean> {
        return this._loadGapiClientAuth2().pipe(
            mergeMap(() => {
                if (this._clientInit) return of(true);
                return from(gapi.client.init({
                    'apiKey': this.developerKey,
                    'clientId': this.clientId,
                    'discoveryDocs': this.discoveryDocs,
                    'scope': this.scopes
                }))
            }
            ),
            tap(() => {
                // GAPI Client is initialized
                this._clientInit = true;

                // Listen for sign-in state changes.
                gapi.auth2.getAuthInstance().isSignedIn.listen(isSignedIn => this.ngZone.run(() => this.updateSigninStatus(isSignedIn)));
                // Handle the initial sign-in state.
                this.ngZone.run(() => this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get()));
            }),
            mapTo(true)
        );
    }

    /***
     * Tracks whether the current user is signedIn
     */
    updateSigninStatus(isSignedIn) {
        // this.isSignedIn = isSignedIn
        if (isSignedIn) {
            this._isSignedIn$.next(true);
            this._username$.next(gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getGivenName());
            this.currentOauthInstance = gapi.auth2.getAuthInstance();
        } else {
            this._isSignedIn$.next(false);
            this._username$.next("");
            this.currentOauthInstance = null;
        }
    }

    /****
     * Retrieve an Oauth Instance for the current user. Load APIs
     * and/or initialize OAuth flow if nessesary.
     ****/
    getOauthInstance(): Observable<any> {
        return combineLatest(
            this._isSignedIn$,
            this.initGapiClient()
        ).pipe(
            // _isSignedIn$ is long-running and we're only interested in one (current) 
            // value, so we need to unsubscribe once we have a value.
            take(1),
            mergeMap(([isSignedIn]) => {
                // We're already signed in, so an auth instance is available
                if (isSignedIn) return of(gapi.auth2.getAuthInstance());

                // Start the Oauth flow for the user, then return an 
                // Oauth instance
                return from(gapi.auth2.getAuthInstance().signIn()).pipe(
                    map(() => gapi.auth2.getAuthInstance())
                );
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
        if (this._isSignedIn$.getValue()) {
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
        if (this._isSignedIn$.getValue()) {
            this.getOauthInstance().subscribe({
                next: oauthInstance => oauthInstance.disconnect(),
                error: console.error
            });
        }
    }

    /***
     * Return gapi.client. This may be asynconous if the service still
     * needs to initialise the client. 
     * 
     * This does not guarantee that a user is authenticated, so trying to use
     * the client may result in a 403: The user does not have sufficient 
     * permissions
     ***/
    getClient(): Observable<any> {
        // The client gets call fairly often and this bypasses doing the
        // initGapiClient() check each time.
        if (this._clientInit) return of(gapi.client);

        // This is safe to return even if the client is initialized before
        // the this Observable is subscribed. 
        return this.initGapiClient().pipe(
            map(() => gapi.client)
        );
    }

}
