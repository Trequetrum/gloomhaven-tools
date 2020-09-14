import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { merge } from 'rxjs';
import { tap, debounceTime } from 'rxjs/operators';

export interface checkmarkGoals {
	boxControls: FormControl[];
	complete: boolean;
}

@Component({
	selector: 'app-battle-goals',
	templateUrl: './battle-goals.component.html',
	styleUrls: ['./battle-goals.component.scss']
})
export class BattleGoalsComponent implements OnInit {

	private _checkmarks: number;
	@Input() set checkmarks(val: number) {
		this._checkmarks = val;
		this.setCheckmarks(val);
	}

	get checkmarks(): number {
		return this.countCheckmarks();
	}

	@Output() update: EventEmitter<number> = new EventEmitter();

	checkboxGroup: checkmarkGoals[];

	constructor() {
		this.checkboxGroup = new Array<checkmarkGoals>();
		for (let i = 0; i < 6; i++) {
			const controls = new Array<FormControl>();
			for (let i = 0; i < 3; i++) {
				controls.push(new FormControl(false));
			}
			this.checkboxGroup.push({
				boxControls: controls,
				complete: false
			});
		}
		this.checkboxGroup.forEach(group => {
			merge(
				...group.boxControls.map(form => form.valueChanges)
			).pipe(
				debounceTime(50)
			).subscribe(_ => {
				const numChecks = this.countCheckmarks();
				if (numChecks !== this._checkmarks) {
					this._checkmarks = numChecks;
					this.update.emit(numChecks);
				}
				this.setCheckmarks(numChecks);
				const checkForFalse = group.boxControls.findIndex(control => !control.value);
				if (checkForFalse === -1) {
					group.complete = true;
				} else {
					group.complete = false;
				}
			});
		})
	}

	ngOnInit(): void {
	}

	countCheckmarks(): number {
		let count = 0;
		this.checkboxGroup.forEach(group => {
			group.boxControls.forEach(control => {
				if (control.value) {
					count++;
				}
			});
		});
		return count;
	}

	setCheckmarks(val: number) {
		this.checkboxGroup.forEach(group => {
			group.boxControls.forEach(control => {
				if (val > 0) {
					if (!control.value) control.setValue(true);
					val--;
				} else {
					if (control.value) control.setValue(false);
				}
			});
		});
	}

}
