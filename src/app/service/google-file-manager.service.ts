import { Injectable } from '@angular/core';
import { GoogleOauth2Service } from './google-oauth2.service';
import { GooglePickerService } from './google-picker.service';
import { DocFile } from '../util/doc-file';
import { JsonFile } from '../model_data/json-file';
import { Observable, concat, from, of, throwError, defer } from 'rxjs';
import { map, mergeMap, filter, flatMap, concatMap, tap } from 'rxjs/operators';
import { StringPair } from '../util/string-pair';

declare var gapi: any;
declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleFileManagerService {

  readonly folderName = "GloomhavenToolsDocs";

  documents = new Map<string, any>();
  gloomtoolsFolderId: string;

  constructor(
    private oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService){

    googlePicker.watchLoadedFiles().subscribe(
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

  /***
   * Emits the google drive folder id where we store our files.
   ***/
  getGloomtoolsFolderId(): Observable<string>{
    // If we already have an ID for the folder, this is very straight forward.
    // We defer to ensure we get the most recent value of the folder ID
    if(this.gloomtoolsFolderId && this.gloomtoolsFolderId.length > 0){
      return defer(() => of(this.gloomtoolsFolderId));
    }

    const folderType = "application/vnd.google-apps.folder";
    const folderName = this.folderName;

    const genFolderObs$ = from(gapi.client.drive.files.list({
        q: "mimeType='" + folderType + "' and name='" + folderName + "' and trashed = false",
        fields: "files(id)"
      })) as Observable<any>;


    return genFolderObs$.pipe(
      mergeMap(response => {
        const folders = response.result.files;

        // Check if we already have access to a folder with the right name
        // I suppose there could be more than one folder. If so, emit the first one we find
        if (folders && folders.length > 0) {
          return of(folders[0].id);
        }

        // If we don't have access to such a folder, then create it and return the ID
        const metadata = {
          mimeType: folderType,
          name: folderName,
          fields: 'id'
        };

        const createfolder$ = from(gapi.client.drive.files.create({
          resource: metadata
        })) as Observable<any>;

        return createfolder$.pipe(
          map(resp => resp.result.id)
        );
      })
    );
  }

  /***
   * Get's all JSON files that the user has given this app
   * access to. Doesn't verify contents or anything.
   ***/
  getAllAccessibleFiles(): Observable<StringPair>{

    // Promise that returns an array of google API files
    const files$ = from(gapi.client.drive.files.list({
      q: "mimeType='application/json' and trashed = false",
      fields: "files(name, id)"
    })) as Observable<any>;

    // Convert promise into observable and map the array of files into a stream
    // of id,name tuples
    return files$.pipe(
      // filter out results that don't have files
      filter(response => {
        const files = response.result.files;
        if (files && files.length > 0) return true;
        return false;
      }),
      // map array of files into stream of (id,name) tuples
      flatMap(response => {
        const files = response.result.files;
        // responses without files will already be filtered
        return from(files.map(file => new StringPair(file.id, file.name)));
      }
    )) as Observable<StringPair>; // Not the right way to type this?
  }

  /***
   * Mostly for debugging. 
   * Logs all accessible files to the console.
   */
  listAllAccessibleFiles(): void{
    let count = 1;
    console.log("Listing Files (Async): ");
    this.getAllAccessibleFiles().subscribe({
      next: stringPair => {
        console.log("File " + count + ": ", stringPair);
        count++;
      }
    });
  }


  saveJsonFile(file: JsonFile){

  }

  /***
   * Creates a new JsonFile with $'name'-gloomtools.json as its name
   * 
   * Will get parent folder ID, or create parent folder if one isn't present
   ***/
  createNewJsonFile(name: string, content?: any): Observable<JsonFile>{

    // Create a new file. New files start with an empty object 
    // that has an ID
    const newJsonFile = new JsonFile();
    newJsonFile.name = name + '-gloomtools.json';
    if(content){
      newJsonFile.content = content;
    }else{
      newJsonFile.content = {
        id: newJsonFile.generateNewObjectId()
      };
    }
    
    const genPostObs = parentId => {
      console.log("genPostObs(): ", parentId);
      // Ready a call to create this file on the user's Google drive
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";
      
      const metadata = {
          'name': newJsonFile.name,
          'parents': [parentId],
          'mimeType': newJsonFile.mimeType + '\r\n\r\n'
      };
      
      const multipartRequestBody = delimiter +  'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) 
        + delimiter + 'Content-Type: ' + newJsonFile.mimeType + '\r\n\r\n' + newJsonFile.contentAsString(true) + close_delim;

      // Convert promise into observeable and return
      return from(gapi.client.request({
          'path': '/upload/drive/v3/files',
          'method': 'POST',
          'params': {
              'uploadType': 'multipart'
          },
          'headers': {
              'Content-Type': 'multipart/related; boundary="' + boundary + '"'
          },
          'body': multipartRequestBody
      })) as Observable<any>;
    }

    // Get our folder ID and merge it into this call.
    return this.getGloomtoolsFolderId().pipe(
      mergeMap(folderId => genPostObs(folderId)),
      filter(response => {
        if(response.status == 200) return true;
        console.error("createNewJsonFile: ", response);
        return false;
      }),
      map(response => {
        newJsonFile.id = response.result.id;
        return newJsonFile;
      })
    );
  }
}