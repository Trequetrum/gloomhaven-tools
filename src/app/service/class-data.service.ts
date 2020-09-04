import { Injectable } from '@angular/core';

import ClassesJson from 'src/assets/json/classes.json';
import { ClassData } from '../json_interfaces/class-data';
import { RaceData } from '../json_interfaces/race-data';
import { ImgIcon } from '../json_interfaces/img-icon';

@Injectable({
	providedIn: 'root',
})
export class ClassDataService {
	private classData = new Array<ClassData>();
	private raceData = new Array<RaceData>();

	constructor() {
		// We trust that the JSON in our assets is well formed. No checks being run at all here.
		this.classData = ClassesJson.classes as [ClassData];
		this.raceData = ClassesJson.races;
	}

	getClassIcons(): ImgIcon[] {
		return this.classData.map(data => data.icon);
	}

	getClassByIcon(icon: ImgIcon): ClassData {
		const index = this.classData.findIndex(data => data.icon.name === icon.name);
		return index >= 0 ? this.classData[index] : null;
	}

	getClassByIconName(iconName: string): ClassData {
		return this.getClassByIcon({ img: {}, name: iconName });
	}

	getRaceDescription(race: string): string {
		const index = this.raceData.findIndex(data => data.name === race);
		return index >= 0 ? this.raceData[index].description : null;
	}
}
