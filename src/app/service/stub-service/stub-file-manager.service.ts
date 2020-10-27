import { Injectable } from '@angular/core';
import { Subject, Observable, Subscription, merge, of, from, interval, zip, timer, EMPTY } from 'rxjs';
import { startWith, scan, shareReplay, take, map, filter, tap, mapTo, mergeMap, reduce } from 'rxjs/operators';
import { JsonFile } from 'src/app/model_data/json-file';
import { FileAlertAction, FileAlertEvent } from '../google-service/google-file-manager.service';

import bobJson from 'src/assets/GloomhavenToolsDocs/Bob_s Your Uncle-gloomtools.json';
import purpJson from 'src/assets/GloomhavenToolsDocs/Purp-gloomtools.json';
import tobJson from 'src/assets/GloomhavenToolsDocs/TobeyTheCoolGuy-gloomtools.json';
import campJson from 'src/assets/GloomhavenToolsDocs/campaign-gloomtools.json';
import realmJson from 'src/assets/GloomhavenToolsDocs/Realm of the Ages-gloomtools.json';
import tupJson from 'src/assets/GloomhavenToolsDocs/Tupperware Warriors-gloomtools.json';
import heyJson from 'src/assets/GloomhavenToolsDocs/HeyThere2-gloomtools.json';
import tEndJson from 'src/assets/GloomhavenToolsDocs/The End Times-gloomtools.json';
import wilJson from 'src/assets/GloomhavenToolsDocs/Willow-gloomtools.json';
import marvJson from 'src/assets/GloomhavenToolsDocs/marvin-gloomtools.json';
import newGJson from 'src/assets/GloomhavenToolsDocs/ThisIsANewName-gloomtools.json';

@Injectable({
	providedIn: 'root'
})
export class StubFileManagerService {
	private _secretJsonLoad = [
		{ id: '1--stub-file', name: 'Bob_s Your Uncle-gloomtools', file: bobJson },
		{ id: '2--stub-file', name: 'Purp-gloomtools', file: purpJson },
		{ id: '3--stub-file', name: 'TobeyTheCoolGuy-gloomtools', file: tobJson },
		{ id: '4--stub-file', name: 'campaign-gloomtools', file: campJson },
		{ id: '5--stub-file', name: 'Realm of the Ages-gloomtools', file: realmJson },
		{ id: '6--stub-file', name: 'Tupperware Warriors-gloomtools', file: tupJson },
		{ id: '7--stub-file', name: 'HeyThere2-gloomtools', file: heyJson },
		{ id: '8--stub-file', name: 'The End Times-gloomtools', file: tEndJson },
		{ id: '9--stub-file', name: 'Willow-gloomtools', file: wilJson },
		{ id: '10-stub-file', name: 'marvin-gloomtools', file: marvJson },
		{ id: '11-stub-file', name: 'ThisIsANewName-gloomtools', file: newGJson }
	];

	// An observable stream of files changes (Load/ Save/ Drop, ect).
	private _fileEvent$: Subject<FileAlertEvent>;

	private _cachedFiles$: Observable<Map<string, JsonFile>>;
	private _cachedFilesSubscription: Subscription;

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
	) {
		this._fileEvent$ = new Subject<FileAlertEvent>();
		this.initializeFileCashe();
		this.loadAllAccessibleFiles().subscribe();
	}

	initializeFileCashe(): void {
		// Apply the given function to the most current map
		const accumulator = (accMap: Map<string, JsonFile>, event: FileAlertEvent): Map<string, JsonFile> => {
			if (event.file == null) {
				return accMap;
			}
			if (event.action === "error" || event.action === "unload") {
				accMap.delete(event.file.id);
			} else if (event.action === "load" || event.action === "save" || event.action === "update") {
				accMap.set(event.file.id, event.file);
			} else {
				throw Error("Unrecognised FileAlertEvent: " + event.action);
			}
			return accMap;
		};

		this._cachedFiles$ = this._fileEvent$.pipe(
			startWith({ action: 'error', file: null }),
			scan(accumulator, new Map<string, JsonFile>()),
			shareReplay(1)
		);

		if (this._cachedFilesSubscription != null) {
			this._cachedFilesSubscription.unsubscribe();
		}
		this._cachedFilesSubscription = this._cachedFiles$.subscribe();
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
	): Observable<FileAlertEvent> {

		const createErrorEvent = (id: string) => {
			const errFile = new JsonFile(id);
			errFile.content = {
				error: {
					type: 'File Not Found',
					message: "Document with id='" + id + "' not found",
				},
			};
			return { action: 'error' as FileAlertAction, file: errFile };
		}

		const currentState$ = this._cachedFiles$.pipe(
			take(1),
			map(mapO => mapO.get(docId)),
			map(file =>
				file != null ? ({ action: 'load' as FileAlertAction, file }) : createErrorEvent(docId)
			)
		);

		const futureState$ = this._fileEvent$.pipe(
			filter(({ file }) => file.id === docId)
		);

		return merge(currentState$, futureState$);
	}

	/****
	 * this.currentDocuments.clear() done via the fileLoad$ subject
	 ****/
	clearAllDocuments(): void {
		this._cachedFiles$.pipe(
			take(1)
		).subscribe(mapO =>
			mapO.forEach(file => this._fileEvent$.next({ action: 'unload', file }))
		);
	}

	/***
	 * Multicast Observable that sends messages whenever a file is
	 * loaded loaded/unloaded
	 */
	listenDocumentLoad(): Observable<{
		action: FileAlertAction,
		file: JsonFile
	}> {
		return this._fileEvent$.asObservable();
	}

	/***
	 * Multicast Observable that sends all current files whenever a file is
	 * loaded/unloaded
	 */
	listenDocuments(): Observable<JsonFile[]> {
		return this._cachedFiles$.pipe(
			map(mapO => Array.from(mapO.values()))
		);
	}

	/*****
	 * Goes to the user's google drive and tries to retrieve a
	 * file with the given ID. This does not cache the file.
	 *****/
	getJsonFileFromDrive(docID: string): Observable<JsonFile> {
		return timer(500).pipe(
			map(_ => this._secretJsonLoad[
				this._secretJsonLoad.findIndex(val => val.id === docID)
			]),
			map(loaded => {
				const file = new JsonFile(loaded.id, loaded.name, true, '__today---STUB__');
				file.content = loaded.file;
				return file;
			})
		);
	}

	/*****
	 * Goes to the user's google drive and tries to load a
	 * file with the given ID. This will cache the file and emit
	 * a load event. Listeners will need to patch their changes
	 * into the new file or just save their changes and wait for a
	 * save event with the patched file
	 *****/
	loadById(docID: string): Observable<boolean> {
		return this.getJsonFileFromDrive(docID).pipe(
			tap(file => this._fileEvent$.next({ action: 'load', file })),
			mapTo(true)
		);
	}

	/****
	 * Remove file from currentDocuments, only emits an unload
	 * if a file with that ID currently exists in memory
	 ***/
	unloadById(docID: string): Observable<boolean> {
		if (docID?.length < 1) {
			return of(false);
		}
		return this._cachedFiles$.pipe(
			map(mapO => mapO.get(docID)),
			tap(file => this.unloadFile(file)),
			map(file => file != null)
		);
	}

	/****
	 * Emit a file unload event with the given file.
	 * As a side effect, file will be removed from currentDocuments if it exists
	 ****/
	unloadFile(file: JsonFile): void {
		if (file != null && file?.id != null) {
			this._fileEvent$.next({ action: 'unload', file });
		}
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
		return EMPTY;
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
		return EMPTY;
	}

	/***
	 * Get's all JSON files that the user has given this app
	 * access to. Doesn't verify contents or anything.
	 ***/
	getAllAccessibleFiles(): Observable<Array<{ id: string, name: string }>> {
		return timer(500).pipe(
			map(_ => this._secretJsonLoad.map(
				file => ({ id: file.id, name: file.name }))
			),
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
		this._cachedFiles$.subscribe(mapO => {
			let count = 1;
			mapO.forEach((val, key) =>
				console.log('File ' + count++ + ': ', val)
			)
		});
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
		return this.listenDocumentById(file.id).pipe(
			take(1),
			map(evt => evt.action != 'error'),
			tap(out => {
				if (out) this._fileEvent$.next({ action: 'save', file })
			})
		)
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

		return of(file).pipe(
			tap(file => this._fileEvent$.next({ action: 'save', file }))
		);
	}

	createAndSaveNewJsonFile(name: string, content?: any): Observable<JsonFile> {
		return this._cachedFiles$.pipe(
			take(1),
			map(mapO => {
				let newId: string;
				for (let i = 100; i < 1000; i++) {
					newId = `${i}--stub-file`;
					const tmp = mapO.get(newId);
					if (tmp == null) break;
				}
				if (!newId) new Error("Cannot create another file. No ID slot found");
				return newId;
			}),
			map(newId => {
				const newFile = new JsonFile(newId, name, true, '__today---STUB-MEMORY__');
				if (content != null) {
					newFile.content = content;
				}
				return newFile;
			}),
			tap(file => this._fileEvent$.next({ action: 'save', file }))
		);
	}
}