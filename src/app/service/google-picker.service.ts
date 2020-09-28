import { Injectable } from '@angular/core';
import { GoogleOauth2Service } from './google-oauth2.service';
import { Subject, Observable } from 'rxjs';
import { mapTo, mergeMap, tap } from 'rxjs/operators';
import { NgZoneStreamService } from './ngzone-stream.service';

declare var gapi: any;
declare var google: any;

@Injectable({
	providedIn: 'root'
})
export class GooglePickerService {

	// We lazy load the google picker api only if it's needed, this
	// is a flag to check if it's been loaded.
	private _apiLoaded = false

	// An observable stream of loaded files.
	private _fileLoad$ = new Subject<any>();

	constructor(
		private oauthService: GoogleOauth2Service,
		private zone: NgZoneStreamService) { }

	/***
	 * An observable that returns true once the Picker
	 * API is loaded.
	 */
	loadPickerApi(): Observable<boolean> {
		return new Observable<boolean>(observer => {
			let suppress = false;

			if (this._apiLoaded && !suppress) {
				observer.next(true);
				observer.complete();
			} else if (!this._apiLoaded) {
				gapi.load('picker', () => {
					if (!suppress) {
						this._apiLoaded = true;
						observer.next(true);
						observer.complete();
					}
				});
			}

			// Error if the picker takes too long to load.
			setTimeout(() => {
				console.error("Loading Google Picker Timed out after 5 seconds");
				if (!suppress) {
					observer.error("Loading Google Picker Timed out after 5 seconds");
				}
			}, 5000);

			return {
				unsubscribe: () => suppress = true
			};
		})
	}

	/***
	* Lets users access the file load stream without giving them 
	* access to the source methods (next, error, complete, ect)
	***/
	listenFileLoad(): Observable<any> {
		return this._fileLoad$.asObservable().pipe(
			this.zone.ngZoneEnter()
		);
	}

	/***
	 * Opens a picker with 'application/json' files in view and a search for
	 * gloomtools files.
	 * 
	 * Let the user pick files from their google drive or load files to their
	 * google drive. Gives our app permission to read/edit those files as per
	 * scropes requested by the oauthService.
	 ***/
	showGloomtoolsGooglePicker(): Observable<boolean> {
		return this.loadPickerApi().pipe(
			mergeMap(_ => this.oauthService.getOauthToken()),
			tap(oauthToken => {
				// Now that we have an OAuthToken, we can load a new google picker and display it.
				const view = new google.picker.View(google.picker.ViewId.DOCS);
				view.setMimeTypes("application/json");
				view.setQuery("gloomtools.json");
				const pickerBuilder = new google.picker.PickerBuilder();
				const picker = pickerBuilder
					/*.enableFeature(google.picker.Feature.NAV_HIDDEN)*/
					.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
					.setAppId(this.oauthService.appId)
					.setOAuthToken(oauthToken)
					.addView(view)
					.addView(new google.picker.DocsUploadView())
					.setCallback(data => this.pickerCallback(data))
					.build();
				picker.setVisible(true);
			}),
			mapTo(true)
		);
	}

	/***
	 * Takes a response object from a google picker.
	 * Emits new documents into the gloomtoolsFileLoad$ Subject (multicast Observable). 
	 * Users can select multiple documents or they can keep opening new pickers to select documents.
	 * To anyone observing gloomtoolsFileLoad$, this should look the same.
	 */
	pickerCallback(response: any): void {
		// Check that the user picked at least one file
		if (response[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
			response[google.picker.Response.DOCUMENTS].forEach(doc => this._fileLoad$.next(doc));
			/*
			let doc = data[google.picker.Response.DOCUMENTS][0];
			let src = doc[google.picker.Document.URL];
			console.log("Document selected is", doc,"and URL is ",src)
			*/
		}
	}
}
