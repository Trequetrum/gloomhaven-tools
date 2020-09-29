import { Injectable, NgZone } from '@angular/core';
import { GoogleOauth2Service } from './google-oauth2.service';
import { GooglePickerService } from './google-picker.service';
import { JsonFile } from '../model_data/json-file';
import {
	Observable,
	from,
	of,
	Subject,
	merge,
	defer,
	forkJoin
} from 'rxjs';
import {
	map,
	mergeMap,
	filter,
	take,
	mapTo,
	tap,
	debounceTime,
	switchMap, reduce
} from 'rxjs/operators';
import { NgZoneStreamService } from './ngzone-stream.service';

declare var google: any;

export type FileAlertAction = 'load' | 'unload' | 'error' | 'update' | 'save';

@Injectable({
	providedIn: 'root',
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

	// An observable stream of files changes (Load/ Save/ Drop, ect).
	private _fileAlert$ = new Subject<{
		action: FileAlertAction;
		file: JsonFile;
	}>();

	// Listens to the fileLoad$ stream and keeps a current record
	currentDocuments = new Map<string, JsonFile>();

	// Name of the folder where we save documents created by this app
	readonly folderName = 'GloomhavenToolsDocs';
	// filename appended
	readonly fileNameAffix = '-gloomtools';

	// Name of the file where google-file-manager.service keeps it's settings/preferences
	readonly fileManagerAppFileName = 'file-manager-data.json';

	// Users can move files or rename the folder. So long as they don't
	// create a new file, this ID will never be used or set
	private _folderId: string;

	// File Manager Service remembers which files where loaded/unloaded
	// by the user and attempts to re-create that state the next time the
	// same user logs back in. This is stored with google drive instead of
	// in a cookie since file loading already relies on google drive
	private _fileManagerAppFile: JsonFile;

	/****
	 * Set up our listeners.
	 *  - Load files selected by the google picker
	 *  - Track log in/out events, then load/unload all files
	 ****/
	constructor(
		private oauthService: GoogleOauth2Service,
		private googlePicker: GooglePickerService,
		private zone: NgZoneStreamService
	) {
		googlePicker
			.listenFileLoad()
			.subscribe(doc => this.loadGooglePickerDocument(doc));

		oauthService.listenSignIn().subscribe((signin) => {
			if (signin) {
				this.loadAllAccessibleFiles().subscribe();
			} else {
				this.clearAllDocuments();
			}
		});
	}

	/***********
	 * Always emmit a value right away. If no such document exists, it will
	 * emit a FileAlert with an error and no file.
	 *      > { action: "error", file: null }
	 *
	 * Then, it emits any time some FileAlert action is performed on the given
	 * file.
	 ***********/
	listenDocumentById(
		docId: string
	): Observable<{ action: FileAlertAction; file: JsonFile }> {
		const streamCurrentDoc = () => {
			let currentDoc;
			if (this.currentDocuments.has(docId)) {
				currentDoc = { action: 'load', file: this.currentDocuments.get(docId) };
			} else {
				const errFile = new JsonFile(docId);
				errFile.content = {
					error: {
						type: 'File Not Found',
						message: "Document with id='" + docId + "' not found",
					},
				};
				currentDoc = { action: 'error', file: errFile };
			}
			return of(currentDoc);
		};
		const alertFilter$ = this._fileAlert$.pipe(
			filter(({ file }) => file.id === docId)
		);
		return merge(defer(streamCurrentDoc), alertFilter$);
	}

	/****
	 * this.currentDocuments.clear() done via the fileLoad$ subject
	 ****/
	clearAllDocuments(): void {
		const docs = this.currentDocuments;
		this.currentDocuments = new Map<string, JsonFile>();
		for (const [key, file] of docs) {
			this._fileAlert$.next({ action: 'unload', file });
		}
	}

	/***
	 * Multicast Observable that sends messages whenever a file is
	 * loaded loaded/unloaded
	 */
	listenDocumentLoad(): Observable<{
		action: FileAlertAction,
		file: JsonFile
	}> {
		return this._fileAlert$.asObservable();
	}

	/***
	 * Multicast Observable that sends messages whenever a file is
	 * loaded loaded/unloaded
	 */
	listenDocuments(): Observable<JsonFile[]> {
		const getCurrentDocuments = () =>
			Array.from(this.currentDocuments.values());
		const currentDocs$ = defer(() => of(getCurrentDocuments()));
		const listenFile$ = this._fileAlert$.pipe(
			debounceTime(250),
			map(getCurrentDocuments)
		);

		return merge(currentDocs$, listenFile$);
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
		if (!this.currentDocuments.has(docID)) {
			this.loadById(docID).subscribe();
		} else {
			console.warn('Document ID found in memory: ', docID);
		}
	}

	/*****
	 * Goes to the user's google drive and tries to retrieve a
	 * file with the given ID. Emits the file if found
	 *****/
	getJsonFileFromDrive(docID: string): Observable<JsonFile> {
		return this.oauthService.getClient().pipe(
			take(1),
			mergeMap((client) =>
				from(
					client.drive.files.get({
						fileId: docID,
						fields: '*', //'id, name, modifiedTime, capabilities(canRename, canDownload, canModifyContent)'
					})
				).pipe(map((res) => [client, res]))
			),
			take(1),
			map(([client, res]) => {
				if (!res.result.capabilities.canDownload) {
					throw Error(
						'Cannot Download File (capabilities.canDownload) - ' +
						res.toString()
					);
				}
				return [
					client,
					new JsonFile(
						res.result.id,
						res.result.name,
						res.result.capabilities.canRename &&
						res.result.capabilities.canModifyContent,
						res.result.modifiedTime
					),
				];
			}),
			mergeMap(([client, file]) =>
				from(
					client.drive.files.get({
						fileId: docID,
						alt: 'media',
					})
				).pipe(
					map((res: any) => {
						try {
							file.content = JSON.parse(res.body);
						} catch (err) {
							file.content = {
								error: {
									type: 'Parsing',
									message: err.message,
								},
							};
						}
						return file;
					})
				)
			),
			this.zone.ngZoneEnter(),
		);
	}

	/*****
	 * Goes to the user's google drive and tries to load a
	 * file with the given ID. If this file already exists in currentDocuments,
	 * it will be replaced and any saved changes will be lost unless they've
	 * been kept elsewhere.
	 *****/
	loadById(docID: string): Observable<boolean> {
		return this.getJsonFileFromDrive(docID).pipe(
			tap((file) => {
				this.currentDocuments.set(file.id, file);
				this._fileAlert$.next({ action: 'load', file });
			}),
			mapTo(true)
		);
	}

	/****
	 * Remove file from currentDocuments, only emits an unload
	 * if a file with that ID currently exists in memory
	 ***/
	unloadById(docID: string): void {
		if (this.currentDocuments.has(docID)) {
			const file = this.currentDocuments.get(docID);
			this.currentDocuments.delete(docID);
			this._fileAlert$.next({ action: 'unload', file });
		}
	}

	/****
	 * Emit a file unload event with the given file.
	 * As a side effect, file will be removed from currentDocuments if it exists
	 ****/
	unloadFile(file: JsonFile) {
		if (this.currentDocuments.has(file.id)) {
			this.currentDocuments.delete(file.id);
		}

		this._fileAlert$.next({ action: 'unload', file });
	}

	/***
	 * Emits the google drive file id where we store our file-manager properties.
	 * Performs the nessesary calls to find or create the file.
	 ***/
	getFileManagerAppFile(): Observable<JsonFile> {
		if (this._fileManagerAppFile && this._fileManagerAppFile.id.length > 0) {
			return of(this._fileManagerAppFile);
		}

		const name = this.fileManagerAppFileName;
		return this.getAppDataByName(name).pipe(
			tap((file) => (this._fileManagerAppFile = file))
		);
	}

	/****
	 * Generic AppData is not tracked by the file manager. This will get a file
	 * from the appDataFolder or create one if it isn't there. This file can be saved
	 * like any other.
	 */
	getAppDataByName(name: string): Observable<JsonFile> {
		return this.oauthService.getClient().pipe(
			mergeMap((client) => {
				return from(
					client.drive.files.list({
						spaces: 'appDataFolder',
						q: "name='" + name + "'",
						fields: 'files(id)',
					})
				).pipe(
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
							fields: 'id',
						};

						return from(
							client.drive.files.create({
								resource: metadata,
							})
						).pipe(map((resp: any) => resp.result.id));
					})
				);
			}),
			mergeMap((docID: string) => this.getJsonFileFromDrive(docID)),
			this.zone.ngZoneEnter()
		);
	}

	/***
	 * Emits the google drive folder id where we store our files.
	 * Performs the nessesary calls to find or create the folder.
	 ***/
	getFolderId(): Observable<string> {
		// If we already have an ID for the folder, this is very straight forward.
		if (this._folderId && this._folderId.length > 0) {
			return of(this._folderId);
		}

		const folderType = 'application/vnd.google-apps.folder';
		const folderName = this.folderName;

		return this.oauthService.getClient().pipe(
			mergeMap((client) =>
				from(
					client.drive.files.list({
						q:
							"mimeType='" +
							folderType +
							"' and name='" +
							folderName +
							"' and trashed = false",
						fields: 'files(id)',
					})
				).pipe(map((response: any) => ({ client, response })))
			),
			mergeMap(({ client, response }) => {
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
					fields: 'id',
				};

				return from(
					client.drive.files.create({
						resource: metadata,
					})
				).pipe(map((resp: any) => resp.result.id));
			}),
			this.zone.ngZoneEnter()
		);
	}

	/***
	 * Get's all JSON files that the user has given this app
	 * access to. Doesn't verify contents or anything.
	 ***/
	getAllAccessibleFiles(): Observable<Array<{ id: string, name: string }>> {
		return this.oauthService.getClient().pipe(
			mergeMap(client => client.drive.files.list({
				q: "mimeType='application/json' and trashed = false", // and appProperties has { key='active' and value='true' }",
				fields: 'files(id, name)',
			})
			),
			// Results from gapi client back into angular zone
			this.zone.ngZoneEnter(),
			// map array of files into stream of (id,name) tuples
			map((response: any) =>
				response?.result?.files?.map(file => ({ id: file.id, name: file.name }))
			)
		);
	}

	/***
	 * Mostly for debugging.
	 * Logs all accessible files to the console.
	 */
	listAllAccessibleFiles(): void {
		let count = 1;
		console.log('Listing Files (Async): ');
		this.getAllAccessibleFiles().subscribe(
			stringPairArr => stringPairArr.forEach(stringPair => {
				console.log('File ' + count + ': ', stringPair);
				count++;
			})
		);
	}

	/***
	 * Mostly for debugging.
	 * Logs all loaded files to the console.
	 */
	listAllLoadedFiles(): void {
		let count = 1;
		this.currentDocuments.forEach((val, key) =>
			console.log('File ' + count++ + ': ', val)
		);
	}

	/**
	 * Loads all files that this app has access to
	 *    TODO: Don't load files users have explicitly unloaded in the past
	 */
	// 
	loadAllAccessibleFiles(): Observable<boolean> {
		return this.getAllAccessibleFiles().pipe(
			mergeMap(files => merge(...files
				// Filter out files we don't want to load
				.filter(file => true)
				// Convert every file into a load stream
				.map(file => this.loadById(file.id))
			)),
			// return true if every file loaded successfully and load false
			// if any of them failed to load.
			reduce((acc, val) => acc && val)
		);
	}

	/**
	 * Update this file's metadata only.
	 * This updates the file's
	 *      - name
	 */
	saveJsonFileMetadata(file: JsonFile): Observable<boolean> {
		return this.oauthService.getClient().pipe(
			mergeMap(client => {
				const metadata = {
					name: file.name,
					mimeType: JsonFile.MIME_TYPE,
				};
				return client.request({
					path: '/drive/v3/files/' + file.id,
					method: 'PATCH',
					body: metadata,
				});
			}),
			this.zone.ngZoneEnter(),
			mapTo(true)
		);
	}

	/***
	 * For now, we just overwrite whatever content the file in the drive currently
	 * holds. Of course, we should be doing much better than that.
	 *    - TODO: We should be patching the most recent file in the drive
	 */
	saveJsonFile(file: JsonFile): Observable<JsonFile> {

		const diff = file.getDiffData();
		if (!diff) {
			return of(file);
		}
		console.log(">>>> Saving JsonFile with diffData: ", diff);

		// Ready a call to Google drive
		const boundary = '-------314159265358979323846';
		const delimiter = '\r\n--' + boundary + '\r\n';
		const close_delim = '\r\n--' + boundary + '--';

		return this.oauthService.getClient().pipe(
			mergeMap(client => {
				const metadata = {
					name: file.name,
					mimeType: JsonFile.MIME_TYPE,
				};

				const multipartRequestBody =
					delimiter +
					'Content-Type: application/json\r\n\r\n' +
					JSON.stringify(metadata) +
					delimiter +
					'Content-Type: ' +
					JsonFile.MIME_TYPE +
					'\r\n\r\n' +
					file.contentAsString(true) +
					close_delim;

				return client.request({
					path: '/upload/drive/v3/files/' + file.id,
					method: 'PATCH',
					params: {
						uploadType: 'multipart',
					},
					headers: {
						'Content-Type': 'multipart/related; boundary="' + boundary + '"',
					},
					body: multipartRequestBody,
				});
			}),
			this.zone.ngZoneEnter(),
			// If there wasn't an error, we know our file was saved succesfully
			mapTo(file),
			tap(file => {
				this.currentDocuments.set(file.id, file);
				this._fileAlert$.next({ action: 'save', file });
			})
		);
	}

	createAndSaveNewJsonFile(name: string, content?: any): Observable<JsonFile> {
		return forkJoin({
			folder: this.getFolderId(),
			client: this.oauthService.getClient(),
		}).pipe(
			switchMap(({ folder, client }) => {
				// Create a new file.
				const newJsonFile = new JsonFile();
				newJsonFile.name = name + this.fileNameAffix + '.json';
				if (content !== null) {
					newJsonFile.content = content;
				}

				// Ready a call to create this file on the user's Google drive
				const boundary = '-------314159265358979323846';
				const delimiter = '\r\n--' + boundary + '\r\n';
				const close_delim = '\r\n--' + boundary + '--';

				const metadata = {
					name: newJsonFile.name,
					parents: [folder],
					mimeType: JsonFile.MIME_TYPE,
				};

				const multipartRequestBody =
					delimiter +
					'Content-Type: application/json\r\n\r\n' +
					JSON.stringify(metadata) +
					delimiter +
					'Content-Type: ' +
					JsonFile.MIME_TYPE +
					'\r\n\r\n' +
					newJsonFile.contentAsString(true) +
					close_delim;

				return from(
					client.request({
						path: '/upload/drive/v3/files',
						method: 'POST',
						params: {
							uploadType: 'multipart',
						},
						headers: {
							'Content-Type': 'multipart/related; boundary="' + boundary + '"',
						},
						body: multipartRequestBody,
					})
				).pipe(
					this.zone.ngZoneEnter(),
					map((response) => ({ file: newJsonFile, response }))
				)
			}),
			map(input => {
				const file: JsonFile = input.file;
				const response: any = input.response;
				file.id = response.result.id;
				file.modifiedTime = response.result.modifiedTime;
				return file;
			}),
			tap((file) => {
				this.currentDocuments.set(file.id, file);
				this._fileAlert$.next({ action: 'save', file });
			})
		);
	}
}
