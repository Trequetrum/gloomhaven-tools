import { Injectable } from '@angular/core';
import { GoogleOauth2Service } from './google-oauth2.service';
import { GooglePickerService } from './google-picker.service';

declare var gapi: any;
declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleLoadFileService {

  hello = "Hi Here";
  documents = new Map<string, any>();

  constructor(
    private oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService){

    googlePicker.gloomtoolsFileLoad$.subscribe(
      doc => this.loadGoogleDocument(doc));    
  }

  loadGoogleDocument(document: any): void{
    const docID = document[google.picker.Document.ID];
    const docURL = document[google.picker.Document.URL];

    // Only load docs we don't already have
    if(!this.documents.has(docID)){
      console.log("Loading " + document[google.picker.Document.NAME] + ": URL : " + docURL);
      this.documents.set(docID, document);
      
      gapi.client.drive.files.get({
        fileId: docID,
        alt: 'media'
      }).then(function(success){
        console.log("HEHEHEHE", success); //the link is in the success.result object
        //success.result    
      }, function(fail){
        console.log("HaHaHaHa", fail);
        console.log('Error '+ fail.result.error.message);
      })
    }
    // If a user is loading this doc again, maybe there's an update we missed?
    else{
      // TODO: Check doc for update mechanism
    }
  } 

  listAllAccessableFiles(){
    gapi.client.drive.files.list({
      'fields': "files(name, id)",
    }).then((response) => {
      const files = response.result.files;
      if (files && files.length > 0) {
        for (var i = 0; i < files.length; i++) {
          console.log(files[i]);
        }
      } else {
        console.log('No files found.');
      }
    });
  }
}


/***** Taken from https://developers.google.com/drive/api/v2/reference/files/get#javascript
 * 
 

function printFile(fileId) {
  var request = gapi.client.drive.files.get({
    'fileId': fileId
  });
  request.execute(function(resp) {
    console.log('Title: ' + resp.title);
    console.log('Description: ' + resp.description);
    console.log('MIME type: ' + resp.mimeType);
  });
}

function downloadFile(file, callback) {
  if (file.downloadUrl) {
    var accessToken = gapi.auth.getToken().access_token;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file.downloadUrl);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = function() {
      callback(xhr.responseText);
    };
    xhr.onerror = function() {
      callback(null);
    };
    xhr.send();
  } else {
    callback(null);
  }
}

*/