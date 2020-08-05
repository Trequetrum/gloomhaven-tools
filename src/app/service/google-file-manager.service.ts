import { Injectable, NgZone } from '@angular/core';
import { GoogleOauth2Service } from './google-oauth2.service';
import { GooglePickerService } from './google-picker.service';
import { JsonFile } from '../model_data/json-file';
import { Observable, from, of, throwError, Subject } from 'rxjs';
import { map, mergeMap, filter, take, mapTo, tap, reduce } from 'rxjs/operators';
import { StringPair } from '../util/string-pair';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleFileManagerService {

  /****
   * Notes:
   *    A file's webcontentLink = https://drive.google.com/uc?id={{file.id}}&export=download
   *    which is a possible place to DL the file if it's publicly available, but not available via client
   * 
   *    A file's webviewlink = https://drive.google.com/file/d/{{file.id}}/view?usp=drivesdk
   *
   * gdrivecontentlink = (docID) => "https://drive.google.com/uc?id=" + docID + "&export=download";
   * gdriveviewlink = (docID) => "https://drive.google.com/file/d/" + docID + "/view?usp=drivesdk";
   * ------------------------------------------------------------------------------------------------------
   * 
   *    GoogleFileManagerService no longer uses appProperties.active to decide if files should be loaded
   *    as this causes issues with files being shared. Instead each user stores their own list of files they
   *    keep loaded or unloaded.
   ****/

  // An observable stream of loaded files.
  private fileLoad$ = new Subject<{load: boolean, file: JsonFile}>();
  // Listens to the fileLoad$ stream and keeps a current record
  readonly currentDocuments = new Map<string, JsonFile>();

  // Name of the folder where we save documents created by this app
  readonly folderName = "GloomhavenToolsDocs";
  // filename appended
  readonly fileNameAffix = "-gloomtools";

  // Name of the file where google-file-manager.service keeps it's settings/preferences
  readonly fileManagerAppFileName = "file-manager-data.json";

  // Users can move files or rename the folder. So long as they don't
  // create a new file, this ID will never be used or set
  private folderId: string;

  // File Manager Service remembers which files where loaded/unloaded
  // by the user and attempts to re-create that state the next time the
  // same user logs back in. This is stored with google drive instead of
  // in a cookie since file loading already relies on google drive 
  private fileManagerAppFile: JsonFile;

  /****
   * Set up our listeners.
   *  - Load files selected by the google picker
   *  - Track current files loaded/unloaded
   *  - Track log in/out events, then load/unload all files
   ****/
  constructor(
    private oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService,
    private ngZone: NgZone){

    this.listenLoadedFiles().subscribe(({load, file})=>{
      if(load){
        this.currentDocuments.set(file.id, file);
      }else{
        this.currentDocuments.delete(file.id);
      }
    });

    googlePicker.listenFileLoad().subscribe((doc) => this.loadGooglePickerDocument(doc));

    oauthService.listenSignIn().subscribe(signin => {
      if(signin){
        this.loadAllAccessibleFiles().subscribe();
      }else{
        this.clearAllDocuments();
      }
    })
  }

  /*****
   * If an observable makes a call to GAPI, we can use this to transform
   * it into an observabel that makes reenters the angular zone
   */
  ngZoneObservable<T>(obs: Observable<T>): Observable<T>{
    return new Observable<T>(observer => {
      obs.subscribe({
        next: val => this.ngZone.run(()=>observer.next(val)),
        error: err => this.ngZone.run(()=>observer.error(err)),
        complete: () => this.ngZone.run(()=>observer.complete),
      });
    }); 
  }

  /****
   * this.currentDocuments.clear() done via the fileLoad$ subject
   ****/
  clearAllDocuments(): void{
    for( let file of this.currentDocuments.values()){
      this.fileLoad$.next({load: false, file});
    }
  }

  /***
   * Multicast Observable that sends messages whenever a file is
   * loaded loaded/unloaded
   */
  listenLoadedFiles(): Observable<{load: boolean, file: JsonFile}>{
    return this.fileLoad$.asObservable();
  }

  /****
   * Call back that reacts to files selected by the google picker
   * 
   * Ignores docs we already have loaded with a warning
   ****/
  loadGooglePickerDocument(document: any): void {
    const docID = document[google.picker.Document.ID];
    // const docURL = document[google.picker.Document.URL];
    // const docName = document[google.picker.Document.NAME];

    // Only load docs we don't already have
    if(!this.currentDocuments.has(docID)){
      this.loadById(docID).subscribe();
    }else{
      console.warn("Document ID found in memory: ", docID);
    }    
  }

  /*****
   * Goes to the user's google drive and tries to retrieve a
   * file with the given ID. Emits the file if found
   *****/
  getJsonFileFromDrive(docID: string): Observable<JsonFile>{
    let rtnObs = this.oauthService.getClient().pipe(
      take(1),
      mergeMap(client => 
        from(client.drive.files.get({
          fileId: docID,
          fields: '*'//'id, name, modifiedTime, capabilities(canRename, canDownload, canModifyContent)'
        })).pipe(map(res => [client, res]))
      ),
      take(1),
      map(([client, res]) => {
        if(!res.result.capabilities.canDownload){
          throw throwError("Cannot Download File (capabilities.canDownload)", res);
        }
        return [client, new JsonFile(
          res.result.id,
          res.result.name,
          res.result.capabilities.canRename && res.result.capabilities.canModifyContent,
          res.result.modifiedTime
        )];
      }),
      mergeMap(([client, file]) => 
        from(client.drive.files.get({
          fileId: docID,
          alt: 'media'
        })).pipe(map((res:any) => {
          try{
            file.setContent(JSON.parse(res.body));
          }catch(err){
            file.setContent({Error: err.message});
          }
          return file;
        }))
      )
    );

    return this.ngZoneObservable(rtnObs);
  }

  /*****
   * Goes to the user's google drive and tries to load a
   * file with the given ID. If this file already exists in currentDocuments,
   * it will be replaced and any saved changes will be lost unless they've
   * been kept elsewhere.
   * 
   * Files that are loaded, will have appProperties.active=true
   *****/
  loadById(docID: string): Observable<boolean>{
    return this.getJsonFileFromDrive(docID).pipe(
      tap(file => this.fileLoad$.next({load: true, file})),
      mapTo(true)
    );
  }

  /****
   * Remove file from currentDocuments, only emits an unload
   * if a file with that ID currently exists in memory
   ***/
  unloadById(docID: string): void{
    if(this.currentDocuments.has(docID)){
      this.fileLoad$.next({load: false, file: this.currentDocuments.get(docID)});
    }
  }

  /****
   * Emit a file unload event with the given file. 
   * As a side effect, file will be removed from currentDocuments if it exists
   ****/
  unloadFile(file: JsonFile){
    this.fileLoad$.next({load: false, file});
  }

  

  /***
   * Emits the google drive file id where we store our file-manager properties.
   * Performs the nessesary calls to find or create the file.
   ***/
  getFileManagerAppFile(): Observable<JsonFile>{
    if(this.fileManagerAppFile && this.fileManagerAppFile.id.length > 0){
      return of(this.fileManagerAppFile);
    }

    const name = this.fileManagerAppFileName;
    return this.getAppDataByName(name).pipe(
      tap(file => this.fileManagerAppFile = file)
    );
  }

  /****
   * Generic AppData is not tracked by the file manager. This will get a file
   * from the appDataFolder or create one if it isn't there. This file can be saved
   * like any other.
   */
  getAppDataByName(name: string): Observable<JsonFile>{
    const rtn = this.oauthService.getClient().pipe(
      mergeMap(client => {
        return from(client.drive.files.list({
          spaces: 'appDataFolder',
          q: "name='" + name + "'",
          fields: "files(id)"
        })).pipe(
          mergeMap((response: any) => {
            const appfiles = response.result.files;

            // Check if we already have access to a file with the right name
            // I suppose there could be more than one such file. If so, emit the first one we find
            if (appfiles && appfiles.length > 0) {
              return of(appfiles[0].id);
            }
    
            // If we don't have access to such a file, then create it and return the ID
            const metadata = {
              mimeType: 'application/json',
              name,
              parents: ['appDataFolder'],
              fields: 'id'
            };
            
            return from(client.drive.files.create({
              resource: metadata
            })).pipe(
              map((resp: any) => resp.result.id)
            );
          })
        );
      }),
      mergeMap((docID: string) => this.getJsonFileFromDrive(docID))
    );

    return this.ngZoneObservable(rtn);
  }

  /***
   * Emits the google drive folder id where we store our files.
   * Performs the nessesary calls to find or create the folder.
   ***/
  getFolderId(): Observable<string>{
    // If we already have an ID for the folder, this is very straight forward.
    if(this.folderId && this.folderId.length > 0){
      return of(this.folderId);
    }

    const folderType = "application/vnd.google-apps.folder";
    const folderName = this.folderName;

    const rtn = this.oauthService.getClient().pipe(
      take(1),
      mergeMap((client: any) => {
        return from(client.drive.files.list({
            q: "mimeType='" + folderType + "' and name='" + folderName + "' and trashed = false",
            fields: "files(id)"
        })).pipe(
          mergeMap((response: any) => {
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
    
            return from(client.drive.files.create({
              resource: metadata
            })).pipe(
              map((resp: any) => resp.result.id)
            );
          }) 
        );
      })
    ) as Observable<string>;

    return this.ngZoneObservable(rtn);
  }

  /***
   * Get's all JSON files that the user has given this app
   * access to. Doesn't verify contents or anything.
   ***/
  getAllAccessibleFiles(): Observable<StringPair>{
    const rtn = this.oauthService.getClient().pipe(
      mergeMap(client => {
        return from(client.drive.files.list({
          q: "mimeType='application/json' and trashed = false", // and appProperties has { key='active' and value='true' }",
          fields: "files(id, name)"
        })).pipe(
          // filter out results that don't have files
          filter((response: any) => {
            const files = response.result.files;
            if (files && files.length > 0) return true;
            return false;
          }),
          // map array of files into stream of (id,name) tuples
          mergeMap(response => {
            const files = response.result.files;
            // responses without files will already be filtered
            return from(files.map(file => new StringPair(file.id, file.name)));
          })
        ) as Observable<StringPair>; // Not the right way to type this?
      })
    );

    return this.ngZoneObservable(rtn);
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

  /***
   * Mostly for debugging. 
   * Logs all loaded files to the console.
   */
  listAllLoadedFiles(): void{
    let count = 1;
    this.currentDocuments.forEach((val, key) => console.log("File " + count++ + ": ", val));
  }

  /**
   * Loads all files that this app has access to
   *    TODO: Don't load files users have explicitly unloaded in the past
   */
  loadAllAccessibleFiles(): Observable<boolean>{
    return this.getAllAccessibleFiles().pipe(
      mergeMap(({id})=> {
        return this.loadById(id);
      }),
      reduce((acc, val) => acc && val, true)
    );
  }

  /**
   * Update this file's metadata only.
   * This updates the file's 
   *      - name 
   */
  saveJsonFileMetadata(file: JsonFile): Observable<boolean>{
    const rtn = this.oauthService.getClient().pipe(
      mergeMap(client => {
        const metadata = {
          'name': file.name,
          'mimeType': file.mimeType
        };
        return from(client.request({
          'path': '/drive/v3/files/' + file.id,
          'method': 'PATCH',
          'body': metadata
        }));
      }),
      mapTo(true)
    );

    return this.ngZoneObservable(rtn);
  }

  /***
   * For now, we just overwrite whatever content the file in the drive currently
   * holds. Of course, we should be doing much better than that.
   *    - TODO: We should be patching the most recent file in the drive
   */
  saveJsonFile(file: JsonFile): Observable<JsonFile>{
    // Ready a call to Google drive
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const rtn = this.oauthService.getClient().pipe(
      mergeMap(client => {
        
        const metadata = {
          'name': file.name,
          'mimeType': file.mimeType
        };
        
        const multipartRequestBody = delimiter +  'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) 
          + delimiter + 'Content-Type: ' + file.mimeType + '\r\n\r\n' + file.contentAsString(true) + close_delim;

        return from(client.request({
          'path': '/upload/drive/v3/files/' + file.id,
          'method': 'PATCH',
          'params': {
              'uploadType': 'multipart'
          },
          'headers': {
              'Content-Type': 'multipart/related; boundary="' + boundary + '"'
          },
          'body': multipartRequestBody
        }));
      }),
      mapTo(file)
    );

    return this.ngZoneObservable(rtn);
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
    newJsonFile.name = name + this.fileNameAffix +'.json';
    if(content){
      newJsonFile.setContent(content);
    }else{
      newJsonFile.setContent({
        empty: "file ;)"
      });
    }
    
    const genPostObs = (parentId) => {
      // Ready a call to create this file on the user's Google drive
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";
      
      const metadata = {
          'name': newJsonFile.name,
          'parents': [parentId],
          'mimeType': newJsonFile.mimeType
      };
      
      const multipartRequestBody = delimiter +  'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) 
        + delimiter + 'Content-Type: ' + newJsonFile.mimeType + '\r\n\r\n' + newJsonFile.contentAsString(true) + close_delim;

      const rtn = this.oauthService.getClient().pipe(
        mergeMap(client => {
          return from(client.request({
            'path': '/upload/drive/v3/files',
            'method': 'POST',
            'params': {
                'uploadType': 'multipart'
            },
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
          }));
        })
      ) as Observable<any>;

      return this.ngZoneObservable(rtn);
    }

    // Get our folder ID and merge it into this call.
    return this.getFolderId().pipe(
      mergeMap(folderId => genPostObs(folderId)),
      filter(response => {
        if(response.status == 200) return true;
        console.error("createNewJsonFile: ", response);
        return false;
      }),
      map(response => {
        newJsonFile.id = response.result.id;
        newJsonFile.modifiedTime = response.result.modifiedTime;
        return newJsonFile;
      }),
      tap(file => this.fileLoad$.next({load: true, file}))
    );
  }
}