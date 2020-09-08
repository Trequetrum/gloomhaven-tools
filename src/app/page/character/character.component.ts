import { Component, OnInit } from '@angular/core';
import { Params, ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DataService } from 'src/app/service/data.service';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { Observable, Subscription } from 'rxjs';
import { CharacterFile } from 'src/app/model_data/character-file';
import { FileAlertAction } from 'src/app/service/google-file-manager.service';

@Component({
	selector: 'app-character',
	templateUrl: './character.component.html',
	styleUrls: ['./character.component.scss'],
})
export class CharacterComponent implements OnInit {
	errorMessage = '';
	newCharacter = true;
	docId: string;
	characterFile: CharacterFile;
	characterSubscription: Subscription;
	signIn$: Observable<boolean>;

	constructor(
		private route: ActivatedRoute,
		public router: Router,
		public authService: GoogleOauth2Service,
		public data: DataService
	) {
		this.docId = 'none';
	}

	ngOnInit(): void {
		// Listen to query parameters to know which character to load
		this.route.queryParams.pipe(filter(params => params.doc)).subscribe(params => this.resolveDocId(params.doc));

		// Track sign-in state.
		this.signIn$ = this.authService.listenSignIn();
	}

	testDocEvent(event: any) {
		console.log('event: ', event);
	}

	changeDocId(docId: string) {
		this.router.navigateByUrl('/character?doc=' + docId);
	}

	resolveDocId(docId: string) {
		this.docId = docId;
		this.newCharacter = false;
		if (docId === 'new') {
			this.newCharacter = true;
		} else {
			if (this.characterSubscription) this.characterSubscription.unsubscribe();

			this.characterSubscription = this.data
				.listenCharacterFileByDocId(docId)
				.subscribe(({ action, file }) => this.characterFileAction(action, file));
		}
	}

	characterFileAction(action: FileAlertAction, file: CharacterFile) {
		console.log('Checking out subscription logic: ', { action, file });

		if (file.isCharacter) {
			if (action === 'update' || action === 'load') {
				this.errorMessage = '';
				this.characterFile = file;
			} else if (action === 'unload') {
				this.errorMessage = file.character.name + ' was just unloaded and is no longer in memory';
				this.characterFile = null;
			} else if (action === 'error') {
				this.errorMessage = file.character.error.message;
			}
		} else if (file.content?.error) {
			this.errorMessage = file.content?.error?.message;
		} else {
			this.errorMessage = 'Unrecognised Error during character load';
		}
	}
}
