import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ImgIcon } from 'src/app/json_interfaces/img-icon';
import { ClassDataService } from 'src/app/service/json-service/class-data.service';

@Component({
	selector: 'app-class-picker',
	templateUrl: './class-picker.component.html',
	styleUrls: ['./class-picker.component.scss'],
})
export class ClassPickerComponent implements OnInit {
	@Output() classClick: EventEmitter<string> = new EventEmitter<string>();
	classIcons = new Array<ImgIcon>();

	constructor(private classData: ClassDataService) { }

	clickClass(picked: string): void {
		this.classIcons.forEach(icon => {
			if (icon.name === picked) {
				(document.getElementById(icon.name + '-ClassPicker') as HTMLImageElement).src = icon.img.px48inv;
			} else {
				(document.getElementById(icon.name + '-ClassPicker') as HTMLImageElement).src = icon.img.px48;
			}
		});
		this.classClick.emit(picked);
	}

	ngOnInit(): void {
		this.classIcons = this.classData.getClassIcons();
	}
}
