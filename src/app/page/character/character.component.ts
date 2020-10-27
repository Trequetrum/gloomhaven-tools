import { Component, OnInit } from '@angular/core';
import { Params, ActivatedRoute, Router } from '@angular/router';
import { filter, map, share, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { DataService } from 'src/app/service/data.service';
import { Observable, Subscription } from 'rxjs';
import { CharacterFile } from 'src/app/model_data/character-file';
import { GoogleOauth2Service } from 'src/app/service/google-service/google-oauth2.service';

@Component({
	selector: 'app-character',
	templateUrl: './character.component.html',
	styleUrls: ['./character.component.scss'],
})
export class CharacterComponent implements OnInit {

	newCharacter$: Observable<boolean>;
	characterFile$: Observable<CharacterFile>;
	errorMessage$: Observable<string>;
	signIn$: Observable<boolean>;

	constructor(
		private route: ActivatedRoute,
		public router: Router,
		public authService: GoogleOauth2Service,
		public data: DataService
	) {
	}

	ngOnInit(): void {
		// Track sign-in state.
		this.signIn$ = this.authService.listenSignIn();

		// Doc Id's entered as query param
		const docId$ = this.route.queryParams.pipe(
			filter(params => params.doc),
			map(params => params.doc)
		);

		// Character file actions from backend based on ID in query Param
		const characterFileId$ = docId$.pipe(
			filter(docId => docId !== "new"),
			switchMap(docId => this.data.listenCharacterFileByDocId(docId)),
			shareReplay(1)
		);

		// Whether we're making a new character
		this.newCharacter$ = docId$.pipe(
			map(docId => docId === "new")
		);

		// Stream of error messages, "" if there's no error
		this.errorMessage$ = characterFileId$.pipe(
			map(({ action, file }) => {
				if (file.isCharacter) {
					if (action === 'update' || action === 'load' || action === 'save') {
						return '';
					} else if (action === 'unload') {
						return file.character.name + ' was just unloaded and is no longer in memory';
					} else if (action === 'error') {
						return file.character.error.message;
					} else {
						return 'Unrecognised Action (' + action + ') on character file';
					}
				} else if (file.content?.error) {
					return file.content?.error?.message;
				}
				return 'Unrecognised Error during character load';
			}),
			startWith("")
		);

		// load/update/whatever the character based on actions from the backend
		this.characterFile$ = characterFileId$.pipe(
			map(({ action, file }) => {
				if (file.isCharacter) {
					if (action === 'update' || action === 'load' || action === 'save') {
						return file;
					}
				}
				return null;
			})
		)
	}

	testDocEvent(event: any) {
		console.log('event: ', event);
	}

	changeDocId(docId: string) {
		this.router.navigateByUrl('/character?doc=' + docId);
	}

}
