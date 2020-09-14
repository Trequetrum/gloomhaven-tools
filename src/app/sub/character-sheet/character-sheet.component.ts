import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CharacterFile } from 'src/app/model_data/character-file';
import { ClassData } from 'src/app/json_interfaces/class-data';
import { ClassDataService } from 'src/app/service/class-data.service';
import { FormControl } from '@angular/forms';
import { debounceTime, tap, mergeMap, switchMap } from 'rxjs/operators';
import { DataService } from 'src/app/service/data.service';
import { merge } from 'rxjs';

@Component({
	selector: 'app-character-sheet',
	templateUrl: './character-sheet.component.html',
	styleUrls: ['./character-sheet.component.scss'],
})
export class CharacterSheetComponent implements OnInit, OnChanges {
	@Input() characterFile: CharacterFile;
	class: ClassData;

	levelControl = new FormControl(1);
	experienceControl = new FormControl(0);
	goldControl = new FormControl(0);
	battleGoalsControl = new FormControl(0);

	constructor(private classDataS: ClassDataService, private fileData: DataService) { }

	ngOnInit(): void {
		this.levelControl.disable();

		// Changing experience may update the character's level alongside
		// updating the character's exp value
		const exp$ = this.experienceControl.valueChanges.pipe(
			debounceTime(500),
			tap(exp => {
				const cExp = this.characterFile.character.experience;

				if (exp !== cExp) {
					console.log(">>>> Updating exp and lvl");
					const nLvl = this.classDataS.convertExpToLevel(exp);
					this.levelControl.setValue(nLvl);
					this.characterFile.character.level = nLvl;
					this.characterFile.character.experience = exp;
				}
			})
		);

		// Changing GP updates the character's gp value
		const gp$ = this.goldControl.valueChanges.pipe(
			tap(gp => this.characterFile.character.gold = gp)
		);

		// Changing battle goals updates the character's battlegoals value
		const battleGoals$ = this.battleGoalsControl.valueChanges.pipe(
			tap(checks => this.characterFile.character.battleGoals = checks)
		);

		merge(exp$, gp$, battleGoals$).pipe(
			debounceTime(2000),
			tap(_ => console.log("> Saving " + this.characterFile.character.name)),
			switchMap(_ => this.fileData.saveFile(this.characterFile))
		).subscribe(_ => console.log("> Saved " + this.characterFile.character.name));
	}

	ngOnChanges(changes: SimpleChanges): void {
		console.log('>>>> Character-Sheet > Logging Changes: ', changes);

		for (const propName in changes) {
			if (changes.hasOwnProperty(propName)) {
				switch (propName) {
					case 'characterFile': {
						this.updateFromCharacterFile(changes[propName].currentValue);
						break;
					}
				}
			}
		}

	}

	updateFromCharacterFile(changed: CharacterFile) {
		this.class = this.classDataS.getClassByName(changed.character.class);
		this.levelControl.setValue(changed.character?.level || 1);
		this.experienceControl.setValue(changed.character?.experience || 0);
		this.goldControl.setValue(changed.character?.gold || 0);
		this.battleGoalsControl.setValue(changed.character?.battleGoals || 0);
	}

}
