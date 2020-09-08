import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DataService } from 'src/app/service/data.service';
import { ClassDataService } from 'src/app/service/class-data.service';
import { PopupStringsComponent } from 'src/app/dialog/popup-strings/popup-strings.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
	selector: 'app-create-character-form',
	templateUrl: './create-character-form.component.html',
	styleUrls: ['./create-character-form.component.scss'],
})
export class CreateCharacterFormComponent implements OnInit {
	@Output() newDocId: EventEmitter<string> = new EventEmitter<string>();
	loading: boolean;
	newCharacterForm = new FormGroup({
		newCharacterName: new FormControl('', [Validators.required]),
		newCharacterLevel: new FormControl(1),
	});

	classPicked: string;

	constructor(private data: DataService, private classData: ClassDataService, public dialog: MatDialog) {
		this.loading = false;
		this.classPicked = 'No Class Selected';
	}

	ngOnInit(): void {}

	onClassPicked(val) {
		this.classPicked = val;
	}

	createNewCharacter(): void {
		const errorStrings = new Array<string>();
		errorStrings.push('Character Creation Error');
		if (!this.newCharacterForm.controls.newCharacterName.valid) {
			errorStrings.push('Character name is required');
		}
		const lvl = this.newCharacterForm.value.newCharacterLevel;
		if (!Number.isInteger(lvl) || lvl < 1 || lvl > 9) {
			errorStrings.push('Character level between 1 and 9 is required');
		}
		if (this.classPicked === 'No Class Selected') {
			errorStrings.push('Character class is required');
		}
		if (errorStrings.length > 1) {
			// open dialog with error messages
			const dialogRef = this.dialog.open(PopupStringsComponent, { data: errorStrings });
		} else {
			// Create new character with the given values
			this.loading = true;
			const classFromName = this.classData.getClassByIconName(this.classPicked);
			if (classFromName.title) {
				this.data
					.createNewCharacter(
						this.newCharacterForm.value.newCharacterName,
						classFromName.title,
						this.newCharacterForm.value.newCharacterLevel
					)
					.subscribe(charFile => {
						this.newDocId.emit(charFile.id);
						this.loading = false;
						console.log('charFile.id: ', charFile.id);
					});
			} else {
				console.log('>>>> ERROR ERROR ERROR!');
			}
		}
	}
}
