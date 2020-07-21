import { Injectable } from '@angular/core';
import { GoogleOauth2Service } from './google-oauth2.service';
import { GooglePickerService } from './google-picker.service';
import { DocFile } from '../util/doc-file';

declare var gapi: any;
declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleLoadFileService {

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

  createNewJsonDocument(): void{

    const testObj = {
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

    const newFile = new File([JSON.stringify(testObj, null, 2)], "newJsonDocument-gloomtools.json", {
      type: 'application/json',
    });

    const fileMetaData = {
      'name': "newJsonDocument-gloomtools.json",
      // 'parents': [folderId],
      'mimeType': "application/json",
      'title': "newJsonDocument-gloomtools.json"
    };
    const media = {
      'mimeType': "application/json",
      'body': newFile.stream(),
      'name': "newJsonDocument-gloomtools.json",
      'title': "newJsonDocument-gloomtools.json"
    };

    gapi.client.drive.files.create({
      'resource': fileMetaData,
      'media': media,
      'fields': 'id, name'
    }).then(response => {
      console.log("Here Here Here Here");
      console.log("response: ", response);
    });

    console.log("Did my create call");
  }

  listAllAccessableFiles(){
    if(this.oauthService.apiLoaded){
      gapi.client.drive.files.list({
        'fields': "files(name, id)",
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
      fields: 'id, name'
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