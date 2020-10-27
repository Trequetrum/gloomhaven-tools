import { Component, OnInit } from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { JsonFile } from 'src/app/model_data/json-file';
import { GoogleFileManagerService } from 'src/app/service/google-service/google-file-manager.service';
import { GoogleOauth2Service } from 'src/app/service/google-service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-service/google-picker.service';

@Component({
	selector: 'app-google-picker',
	templateUrl: './google-picker.component.html',
	styleUrls: ['./google-picker.component.scss']
})
export class GooglePickerComponent implements OnInit {

	testFile: JsonFile;
	testObj = {
		'id': 0,
		'Campaign': {
			'id': 1,
			'Name': "testing campaign",
			'GlobalAchievements': [
				"One",
				"Two",
				"Three"
			],
			'Parties': [{
				'id': 2,
				'Name': "testing party 1"
			}, {
				'id': 3,
				'Name': "testing party 2"
			}]
		}
	};
	testObj2 = {
		'id': 0,
		'Campaign': {
			'id': 1,
			'Name': "testing2 campaign2",
			'GlobalAchievements': [
				"One2",
				"Two2",
				"Three2"
			],
			'Parties': [{
				'id': 2,
				'Name': "testing party 1-2"
			}, {
				'id': 3,
				'Name': "testing party 2-2"
			}]
		}
	};

	constructor(
		private oauthService: GoogleOauth2Service,
		private googlePicker: GooglePickerService,
		private googleFileLoader: GoogleFileManagerService) {

	}

	ngOnInit(): void {
	}

	loadGooglePicker() {
		this.googlePicker.showGloomtoolsGooglePicker();
	}

	getUserObj() {
		this.oauthService.getUserName().subscribe({
			next: userName => {
				console.log("UserName: ", userName);
			}
		});
	}

	signOut() {
		this.oauthService.signOut();
	}

	revokeAccess() {
		this.oauthService.revokeAccess();
	}

	setFolder() {
		this.googleFileLoader.getFolderId().subscribe({
			next: id => console.log("getGloomtoolsFolderId(): ", id)
		});
	}

	loadFiles() {
		this.googleFileLoader.loadAllAccessibleFiles().subscribe({
			complete: () => console.log("loadAllAccessibleFiles() Complete")
		});
	}

	listFiles() {
		this.googleFileLoader.listAllAccessibleFiles();
	}

	listLoadedFiles() {
		this.googleFileLoader.listAllLoadedFiles();
	}

	clearAllDocuments() {
		this.googleFileLoader.clearAllDocuments();
	}
}
