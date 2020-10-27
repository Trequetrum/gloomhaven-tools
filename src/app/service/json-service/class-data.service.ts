import { Injectable } from '@angular/core'
import { ClassData } from 'src/app/json_interfaces/class-data'
import { ImgIcon } from 'src/app/json_interfaces/img-icon'
import { RaceData } from 'src/app/json_interfaces/race-data'

import ClassesJson from 'src/assets/json/classes.json'

@Injectable({
	providedIn: 'root',
})
export class ClassDataService {
	private classData = new Array<ClassData>()
	private raceData = new Array<RaceData>()

	constructor() {
		// We trust that the JSON in our assets is well formed. No checks being run at all here.
		this.classData = ClassesJson.classes as [ClassData]
		this.raceData = ClassesJson.races
	}

	getClassByName(name: string): ClassData {
		const index = this.classData.findIndex(data => data.title === name)
		return index >= 0 ? this.classData[index] : null
	}

	getClassIcons(): ImgIcon[] {
		return this.classData.map(data => data.icon)
	}

	getClassByIcon(icon: ImgIcon): ClassData {
		const index = this.classData.findIndex(data => data.icon.name === icon.name)
		return index >= 0 ? this.classData[index] : null
	}

	getClassByIconName(iconName: string): ClassData {
		return this.getClassByIcon({ img: {}, name: iconName })
	}

	getRaceDescription(race: string): string {
		const index = this.raceData.findIndex(data => data.name === race)
		return index >= 0 ? this.raceData[index].description : null
	}

	convertExpToLevel(exp: number): number {
		// Math.floor(Math.sqrt((2 / 5 * exp) + (289 / 4)) - (15 / 2));
		return Math.max(0, Math.min(9, Math.floor(Math.sqrt((0.4 * exp) + (72.25)) - (7.5))));
	}

	convertLevelToExp(lvl: number): number {
		return 5 * (lvl - 1) * (8 + (lvl / 2));
	}

	convertLevelToGold(lvl: number): number {
		return 15 * (lvl + 1);
	}
}
