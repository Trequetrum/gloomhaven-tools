import { Injectable } from '@angular/core';
import { GoogleOauth2Service } from './google-oauth2.service';
import { Subject } from 'rxjs';

declare var gapi: any;
declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GooglePickerService {

  constructor(private oauthService: GoogleOauth2Service) { }

  // We lazy load the google picker api only if it's needed, this
  // is a flag to check if it's been loaded.
  apiLoaded = false;

  // An observable stream of loaded files.
  gloomtoolsFileLoad$ = new Subject<any>();
  
  /***
   * Opens a picker with 'application/json' files in view and a search for
   * gloomtools files.
   * 
   * Let the user pick files from their google drive or load files to their
   * google drive. Gives our app permission to read/edit those files as per
   * scropes requested by the oauthService.
   */
  showGloomtoolsGooglePicker(): void{
    // Load the API if it hasn't been loaded yet.
    if(!this.apiLoaded){
      gapi.load('picker', () => {
        this.apiLoaded = true;
        this.showGloomtoolsGooglePicker();
      });
    }else{ // API is loaded

      this.oauthService.getOauthToken().subscribe({
        next: (oauthToken) => {
          // Now that we have an OAuthToken, we get load a new google picker and display it.
          const view = new google.picker.View(google.picker.ViewId.DOCS);
          view.setMimeTypes("application/json");
          view.setQuery("gloomtools.json");
          const pickerBuilder = new google.picker.PickerBuilder();
          const picker = pickerBuilder
            /*.enableFeature(google.picker.Feature.NAV_HIDDEN)*/
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(oauthToken)
            .addView(view)
            .addView(new google.picker.DocsUploadView())
            .setCallback(data=>this.pickerCallback(data))
            .build();
          picker.setVisible(true);
        },
        complete: () => {/* Do nothing */},
        error: (errorObj) => console.log(errorObj)
      });


    }
  }

  /***
   * Takes a response object from a google picker.
   * Emits new documents into the gloomtoolsFileLoad$ Subject (multicast Observable). 
   * Users can select multiple documents or they can keep opening new pickers to select documents.
   * To anyone observing gloomtoolsFileLoad$, this should look the same.
   */
  pickerCallback(response: any): void{
    // Check that the user picked at least one file
    if (response[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
      response[google.picker.Response.DOCUMENTS].forEach((doc)=>this.gloomtoolsFileLoad$.next(doc));
      /*
      let doc = data[google.picker.Response.DOCUMENTS][0];
      let src = doc[google.picker.Document.URL];
      console.log("Document selected is", doc,"and URL is ",src)
      */
    }
  }

  /**
   * GooglePickerService will lazy-load the api whenever nesseasry, but this can be done early
   * if nessesary.
   */
  loadPickerApi(): void{
    // Load the API if it hasn't been loaded yet.
    if(!this.apiLoaded){
      gapi.load('picker', () => {
        this.apiLoaded = true;
      });
    }
  }

}
