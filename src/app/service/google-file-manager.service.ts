import { Injectable } from '@angular/core';
import { GoogleOauth2Service } from './google-oauth2.service';
import { GooglePickerService } from './google-picker.service';
import { DocFile } from '../util/doc-file';
import { JsonFile } from '../model_data/json-file';
import { Observable, concat } from 'rxjs';
import { map, filter } from 'rxjs/operators';

declare var gapi: any;
declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleFileManagerService {

  documents = new Map<string, any>();
  gloomtoolsFolderId: string;

  constructor(
    private oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService){

    googlePicker.gloomtoolsFileLoad$.subscribe(
      doc => this.loadGooglePickerDocument(doc));    
  }

  /**
   * Call back that reacts to files selected by the google picker
   */
  loadGooglePickerDocument(document: any): void{
    const docID = document[google.picker.Document.ID];
    const docURL = document[google.picker.Document.URL];

    // Only load docs we don't already have
    if(!this.documents.has(docID)){
      console.log("Loading " + document[google.picker.Document.NAME] + ": URL : " + docURL);
      this.documents.set(docID, document);
      
      gapi.client.drive.files.get({
        fileId: docID,
        alt: 'media'
      }).then(success => {
        console.log("success: ", success); //the link is in the success.result object
        console.log("success.body: ", success.body);    
      }, fail => {
        console.log("Error: ", fail);
        console.log('Error Message: '+ fail.result.error.message);
      });
    }
    // If a user is loading this doc again, maybe there's an update we missed?
    else{
      // TODO: Doc update mechanism
    }
  }

  /**
   * Observable that completes once the folder ID is set, or emits an error.
   * 
   * This can can concatenated with other streams to ensure they don't start
   * until the folder ID is set.
   */
  setGloomtoolsFolderId(): Observable<boolean>{
    // If we already have an ID for the folder, just complete immediately
    if(this.gloomtoolsFolderId && this.gloomtoolsFolderId.length > 0){
      return new Observable<boolean>(observer => {
        observer.complete();
        return {unsubscribe() {/* Do Nothing */}};
      });
    }

    // Folder name to look for
    // TODO: Maybe in the future we'll let users set their own folder naming preferences
    // using google's app-properties files. 
    const folderType = "application/vnd.google-apps.folder";
    const folderName = "GloomhavenToolsDocs";

    return new Observable<boolean>(observer => {
      if(this.oauthService.apiLoaded){

        // Get a lost of all available folders
        gapi.client.drive.files.list({
          q: "mimeType='" + folderType + "' and trashed = false",
          fields: "files(name, id)"
        }).then(response => {

          const files = response.result.files;

          // Check if we already have access to a folder with the right name
          if (files && files.length > 0) {
            files.forEach(file => {
              if(file.name == folderName){
                this.gloomtoolsFolderId = file.id;
              }
            });
          }

          if(this.gloomtoolsFolderId && this.gloomtoolsFolderId.length > 0){
            observer.complete();
          }else{
            // Create a new folder, since we couldn't find one by this name

            const metadata = {
              mimeType: folderType,
              name: folderName,
              fields: 'id'
            };

            gapi.client.drive.files.create({
              resource: metadata
            }).then(resp => {
              this.gloomtoolsFolderId = resp.result.id;
              observer.complete();
            });
          }
        });
      } else {
        observer.error('No Api, No User; Folder not created');
      }
      return {unsubscribe() {/* Do Nothing */}};
    });
  }

  listAllAccessableFiles(){
    if(this.oauthService.apiLoaded){
      gapi.client.drive.files.list({
        q: "mimeType='application/json' and trashed = false",
        fields: "files(name, id)"
      }).then(response => {
        const files = response.result.files;
        if (files && files.length > 0) {
          for (var i = 0; i < files.length; i++) {
            console.log(files[i].name, files[i].id);
          }
        } else {
          console.log('No files found.');
        }
      });
    } else {
      console.log('No User; No files found.');
    }
  }

  existsJsonFile(file: JsonFile): boolean{
    // Check if this file has been loaded into memory
    if(file.id && this.documents[file.id]){
      return true;
    }

    // Check there is a file with this name or ID accessable 
    if(this.oauthService.apiLoaded){
      gapi.client.drive.files.list({
        q: "mimeType=" + file.mimeType,
        fields: "files(name, id)"
      }).then(response => {
        const files = response.result.files;
        if (files && files.length > 0) {
          for (var i = 0; i < files.length; i++) {
            console.log(files[i].name, files[i].id);
          }
        } else {
          return false;
        }
      });
    } else {
      console.error("existsJsonFile: oauthService not loaded");
      return false;
    }
  }

  saveJsonFile(file: JsonFile){

  }

  /***
   * Creates a new JsonFile with $'name'-gloomtools.json as its name
   * 
   * Calls setGloomtoolsFolderId() and only emits a new file once that call completes
   */
  createNewJsonFile(name: string): Observable<JsonFile>{

    // 
    const newfile$ = new Observable<JsonFile>(observer => {
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";
      
      const newJsonFile = new JsonFile();
      newJsonFile.name = name + '-gloomtools.json';
      newJsonFile.content = {
        id: newJsonFile.generateNewObjectId()
      };
      
      var metadata = {
          'name': newJsonFile.name,
          'parents': [this.gloomtoolsFolderId],
          'mimeType': newJsonFile.mimeType + '\r\n\r\n'
      };
      
      var multipartRequestBody = delimiter +  'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) 
        + delimiter + 'Content-Type: ' + newJsonFile.mimeType + '\r\n\r\n' + newJsonFile.contentAsString(true) + close_delim;
      
      gapi.client.request({
          'path': '/upload/drive/v3/files',
          'method': 'POST',
          'params': {
              'uploadType': 'multipart'
          },
          'headers': {
              'Content-Type': 'multipart/related; boundary="' + boundary + '"'
          },
          'body': multipartRequestBody
      }).then(response => {
          console.log(response);
      });

      return {unsubscribe() {/* Do Nothing */}};
    });

    // No idea if this is the best way to do this? The map here is a dummy operation since
    // setGloomtoolsFolderId() doesn't emit anything.
    const setFolderComplete$ = this.setGloomtoolsFolderId().pipe(map(input => null));
    return concat(setFolderComplete$, newfile$);
  }


  testObj = {
    "Campaign": {
      "Name": "testing campaign",
      "GlobalAchievements": [
        "One",
        "Two",
        "Three"
      ],
      "Parties": [{
        "Name": "testing party 1"
      },{
        "Name": "testing party 2"
      }]
    }
  };

  saveFile(file: DocFile, callback: Function) {

    function addContent(fileId) {
      return gapi.client.request({
          path: '/upload/drive/v3/files/' + fileId,
          method: 'PATCH',
          params: {
            uploadType: 'media'
          },
          body: file.content
        })
    }

    let metadata = {
      mimeType: file.mimeType,
      name: file.name,
      fields: 'id'
    }

    if (file.parents) {
      (metadata as any).parents = file.parents;
    }

    if (file.id) { //just update
      addContent(file.id).then(resp => {
        console.log('File just updated', resp.result);
        callback(resp.result);
      })
    } else { //create and update
      gapi.client.drive.files.create({
        resource: metadata
      }).then(function(resp) {
        addContent(resp.result.id).then(resp => {
          console.log('created and added content', resp.result);
          callback(resp.result);
        })
      });
    }
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