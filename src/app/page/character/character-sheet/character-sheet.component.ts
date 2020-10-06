import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CharacterFile } from 'src/app/model_data/character-file';
import { ClassData } from 'src/app/json_interfaces/class-data';
import { ClassDataService } from 'src/app/service/class-data.service';
import { FormControl } from '@angular/forms';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { DataService } from 'src/app/service/data.service';
import { merge, Observable } from 'rxjs';

@Component({
	selector: 'app-character-sheet',
	templateUrl: './character-sheet.component.html',
	styleUrls: ['./character-sheet.component.scss'],
})
export class CharacterSheetComponent implements OnInit {
	private _characterFile: CharacterFile;
	@Input() set characterFile(charVal: CharacterFile) {
		this._characterFile = charVal;
		this.updateFromCharacterFile(charVal);
	}
	get characterFile(): CharacterFile {
		return this._characterFile;
	}

	class: ClassData;

	levelControl = new FormControl(1);
	experienceControl = new FormControl(0);
	goldControl = new FormControl(0);
	battleGoalsControl = new FormControl(0);
	notesControl = new FormControl("");

	constructor(private classDataS: ClassDataService, private fileData: DataService) { }

	ngOnInit(): void {
		this.levelControl.disable();

		// ControlStreams
		const controlStreams = new Array<Observable<any>>();

		// Changing experience may update the character's level alongside
		// updating the character's exp value
		controlStreams.push(this.experienceControl.valueChanges.pipe(
			debounceTime(500),
			tap(exp => {
				const cExp = this.characterFile.character.experience;

				if (exp !== cExp) {
					const nLvl = this.classDataS.convertExpToLevel(exp);
					this.levelControl.setValue(nLvl);
					this.characterFile.character.level = nLvl;
					this.characterFile.character.experience = exp;
				}
			})
		));

		// Changing GP updates the character's gp value
		controlStreams.push(this.goldControl.valueChanges.pipe(
			tap(gp => this.characterFile.character.gold = gp)
		));

		// Changing battle goals updates the character's battlegoals value
		controlStreams.push(this.battleGoalsControl.valueChanges.pipe(
			tap(checks => this.characterFile.character.battleGoals = checks)
		));

		// Changes updates character file
		controlStreams.push(this.notesControl.valueChanges.pipe(
			tap(note => this.characterFile.character.notes = note)
		));

		// Save after changes on the controls
		merge(...controlStreams).pipe(
			debounceTime(2000),
			switchMap(_ => this.fileData.saveFile(this.characterFile))
		).subscribe(_ => console.log());
	}

	updateFromCharacterFile(changed: CharacterFile) {
		if (changed != null) {
			this.class = this.classDataS.getClassByName(changed.character.class);
			this.levelControl.setValue(changed.character?.level || 1);
			this.experienceControl.setValue(changed.character?.experience || 0);
			this.goldControl.setValue(changed.character?.gold || 0);
			this.battleGoalsControl.setValue(changed.character?.battleGoals || 0);
			this.notesControl.setValue(changed.character?.notes || "");
		}
	}

}
