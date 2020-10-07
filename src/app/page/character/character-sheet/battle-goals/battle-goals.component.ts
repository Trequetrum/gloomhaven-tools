import { Component, OnInit, Input, EventEmitter, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { merge, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface checkmarkGoals {
	boxControls: FormControl[];
	complete: boolean;
}

/****
 * The BattleGoalsComponent tracks a user's checkmarks. 
 * When a user toggles a checkmark, an event is fired that emits the total number of checkmarks.
 * 
 * BattleGoalsComponent integrates nicely with Angular’s form APIs. This means you can use
 * formControl and NgModel just like with other inputs.
 ****/
@Component({
	selector: 'app-battle-goals',
	templateUrl: './battle-goals.component.html',
	styleUrls: ['./battle-goals.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => BattleGoalsComponent),
			multi: true
		}
	]
})
export class BattleGoalsComponent implements OnInit, ControlValueAccessor {

	// Track checkmarks so we don't emit a value if somehow it hasn't changed
	private _checkmarks: number;
	numPerks: number;

	// Picks up when this component is used in a template and sets the checkmarks accordingly
	@Input() set checkmarks(val: number) {
		this._checkmarks = val;
		this.numPerks = Math.floor(val / 3);
		this.setCheckmarks(val);
	}

	get checkmarks(): number {
		return this.countCheckmarks();
	}

	// Emits a value between 0 - 18 when the number of checkmarks changes
	@Output() update: EventEmitter<number> = new EventEmitter();

	// Tracks our form controls so we can toggle checkmarks and show the right
	// icon per group of 3
	checkboxGroup: checkmarkGoals[];

	constructor() {
		// Initialize checkboxGroup with FormControls
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

		// Merges all our formControl.valueChanges observables into a single stream.
		let checkboxes$: Observable<boolean>;

		// Register to listen to changes on any of the checkboxes, when they change update the
		// componant accordingly.
		this.checkboxGroup.forEach(group => {
			const grouping$ = merge(
				// The '...' destructures the array
				...group.boxControls.map(form => form.valueChanges)
			);

			// Merge each grouping into checkboxes$
			checkboxes$ = checkboxes$ ? merge(checkboxes$, grouping$) : grouping$;

			// Each grouping tracks whether the group is complete. This happens when all contained
			// checkboxes are checked (true).
			grouping$.pipe(
				debounceTime(50)
			).subscribe(_ =>
				group.complete = (group.boxControls.findIndex(control => !control.value) === -1)
			);
		});

		// Whenever a checkbox changes state, we count up the checkmarks and re-arrange if nessesary
		checkboxes$.subscribe(_ => {
			const numChecks = this.countCheckmarks();
			if (numChecks !== this._checkmarks) {
				this._checkmarks = numChecks;
				this.numPerks = Math.floor(numChecks / 3);
				this.update.emit(numChecks);
			}
			this.setCheckmarks(numChecks);
		});
	}

	ngOnInit(): void { }

	disableAllBoxes(): void {
		this.checkboxGroup.forEach(group => {
			group.boxControls.forEach(control => {
				control.disable();
			});
		});
	}

	enableAllBoxes(): void {
		this.checkboxGroup.forEach(group => {
			group.boxControls.forEach(control => {
				control.enable();
			});
		});
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
					// The control fires fewer events if we only set values when nessesary
					if (!control.value) control.setValue(true);
					val--;
				} else {
					if (control.value) control.setValue(false);
				}
			});
		});
	}

	/****
	 * ControlValueAccessor methods
	 */

	// Written value is reflected by checkmarks 
	// (which sets numPerks and all that)
	writeValue(val: any): void {
		if (Number.isInteger(Math.floor(val))) {
			this.setCheckmarks(val);
		}
	}

	// Our update event tracks changes, so we can use it to fire the registered
	// function as well
	registerOnChange(fn: any): void {
		this.update.subscribe(fn);
	}

	registerOnTouched(fn: any): void {
		// Do nothing
	}

	setDisabledState(isDisabled: boolean): void {
		if (isDisabled) {
			this.disableAllBoxes();
		} else {
			this.enableAllBoxes();
		}
	}
}
