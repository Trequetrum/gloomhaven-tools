import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CharacterFile } from 'src/app/model_data/character-file';
import { ClassData } from 'src/app/json_interfaces/class-data';
import { ClassDataService } from 'src/app/service/class-data.service';
import { FormControl } from '@angular/forms';

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

	constructor(private classDataS: ClassDataService) { }

	ngOnInit(): void {
		this.levelControl.disable();
	}

	ngOnChanges(changes: SimpleChanges): void {
		console.log('Character-Sheet > Logging Changes: ', changes);

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
		this.levelControl.setValue(changed.character.level);
		this.experienceControl.setValue(changed.character.experience);
		this.goldControl.setValue(changed.character.gold);
	}

}
