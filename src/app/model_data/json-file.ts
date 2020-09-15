import { isArray } from 'util';

/*****
 * File that tracks changes to it's content. 
 * Really the content should only be set once.
 * Afterwards, it can be patched with a patchfile as a way to ensure changes are kept
 */
export class JsonFile {

	readonly mimeType = "application/json";
	private _content: any;
	private _updatableContent: any;

	constructor(
		public id?: string,
		public name?: string,
		public canEdit?: boolean,
		public modifiedTime?: string
	) { }

	/***
	 * Returns a deep clone of this file that has tracked all the same changes
	 */
	clone(): JsonFile {
		const file = new JsonFile(this.id, this.name, this.canEdit, this.modifiedTime);
		file["_content"] = JSON.parse(JSON.stringify(this._content));
		file["_updatableContent"] = JSON.parse(JSON.stringify(this._updatableContent));
		return file;
	}

	get content(): any {
		if (!this._updatableContent && this._content)
			this._updatableContent = JSON.parse(JSON.stringify(this._content))

		return this._updatableContent;
	}

	set content(content: any) {
		// If we're setting content, then we can't have any updates.
		this._updatableContent = null;

		// what's being passed in has _gDocObjID, we assume it's ready to go and
		// do not mutate it.
		if (content && !content._gDocObjID)
			JsonFile.mutateAddIds()(content);
		this._content = content;
	}

	contentAsString(pretty: boolean): string {

		let stringify = "";
		let content;

		if (this._updatableContent) {
			content = this._updatableContent;
		} else {
			content = this._content;
		}

		if (content && pretty) {
			stringify = JSON.stringify(content, null, 2);
		} else if (content) {
			stringify = JSON.stringify(content);
		}

		return stringify;
	}

	/***
	 * Check to see if this file has any updates. This is done by comparing
	 * The content that was first set against any changes that have been made 
	 * to this content
	 * Returns true the moment a difference is found.
	 ***/
	hasDiff(): boolean {

		const checkDiff = (anything): boolean => {
			if (Array.isArray(anything)) {
				for (let val of anything) {
					const rtn = checkDiff(val);
					if (rtn) return true;
				}
			}
			return false;
		}

		return false;
	}

	// What would you have to do to arr1 in order to create arr2?
	// This diff does not care about array order
	static arrayDiff(arr1: Array<any>, arr2: Array<any>): { addValues: Array<any>, removeValues: Array<any> } {
		const array1minus2 = (array1, array2) => {
			array2 = [...array2];
			return array1.filter(val => {
				// Never include nested arrays in the diff
				if (Array.isArray(val)) {
					return false;
				}

				// If the val is an object, compare via _gDocObjID. Don't bother with
				// slices and such as _gDocObjID is expected to be unique.
				let index = -1;
				if (JsonFile.isObject(val)) {
					index = array2.findIndex(v => val?._gDocObjID === v?._gDocObjID);
					if (index > -1) {
						return false;
					}
				}

				// Otherwise, compare as usual
				index = array2.indexOf(val);

				// If both arrays contain this value, they're not in the difference. 
				if (index > -1) {
					// Splice out the value, so that duplicate values are accounted for
					array2.splice(index, 1);
					return false;
				}
				return true;
			});
		};
		return { addValues: array1minus2(arr2, arr1), removeValues: array1minus2(arr1, arr2) };
	}

	static getChildWithId(id: number, anything): object {
		if (Array.isArray(anything)) {
			for (let val of anything) {
				const rtn = JsonFile.getChildWithId(id, val);
				if (rtn) return rtn;
			}
		} else if (JsonFile.isObject(anything)) {
			if (anything._gDocObjID === id) return anything;
			for (let key in anything) {
				if (anything.hasOwnProperty(key)) {
					const rtn = JsonFile.getChildWithId(id, anything.key);
					if (rtn) return rtn;
				}
			}
		}
		return null;
	}

	static isObject(tst) {
		return Object.prototype.toString.call(tst) === '[object Object]';
	}

	static mutateAddIds(): (any) => void {
		let currGDocID = 0;

		const mutateIds = (anything) => {
			if (Array.isArray(anything)) {

				anything.forEach(mutateIds);

			} else if (JsonFile.isObject(anything)) {

				anything._gDocObjID = currGDocID++;
				for (let key in anything) {
					if (anything.hasOwnProperty(key)) {
						mutateIds(anything[key]);
					}
				}

			}
		}

		return mutateIds;
	}

	static mutateRemoveIds(anything) {
		if (Array.isArray(anything)) {

			anything.forEach((val) => JsonFile.mutateRemoveIds(val));

		} else if (JsonFile.isObject(anything)) {

			delete anything._gDocObjID;
			for (let key in anything) {
				if (anything.hasOwnProperty(key)) {
					JsonFile.mutateRemoveIds(anything[key]);
				}
			}
		}
	}



}
