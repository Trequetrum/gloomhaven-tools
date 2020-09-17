import { isArray } from 'util';

/*****
 * File that tracks changes to it's content. 
 * Really the content should only be set once.
 * Afterwards, it can be patched with a patchfile as a way to ensure changes are kept
 * 
 * Some notes about the data format a JsonFile expect. A JsonFile should contrain a JSON
 * object and not a javascript object. This means it should serialize nicely, not include functions,
 * ect. Content will ignore inheretence and such. 
 * 
 * JsonFile arrays are limited in how they can be used. Since not clobbering old values on new writes
 * is a priority, values in an array do not guarantee order. All you can do is add or remove items from
 * an array. 
 * 
 * In general, you should never nest an array inside another array. Arrays are identified by the key they're 
 * attached to on an object. When it is run, diff-patching will drop all changes in nested arrays. Moved arrays
 * may have some unintuitive behaviour as well. Diff-patch treats new and moved arrays as a list of added items.
 */
export class JsonFile {

	static readonly ARRAY_DIFF_ID_VALUE = -8;
	readonly mimeType = "application/json";
	private _content: any;
	private _updatableContent: any;
	private _cleanDiffData: boolean;
	private _diffData: Array<{ [key: string]: any }>;

	constructor(
		public id?: string,
		public name?: string,
		public canEdit?: boolean,
		public modifiedTime?: string
	) {
		this._cleanDiffData = false;
	}

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

		this._cleanDiffData = false;
		return this._updatableContent;
	}

	set content(content: any) {
		// If we're setting content, then we can't have any updates.
		this._updatableContent = null;
		this._cleanDiffData = false;

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
	 * 
	 * Right now, this is done by doing the entire diff. Since that's expensive, the
	 * diff is cashed and only get's re-run if the JsonFile's content is accessed. 
	 ***/
	hasDiff(): boolean {
		if (this._cleanDiffData) {
			return this._diffData?.length > 0;
		} else {
			this._diffData = JsonFile.objDiff(this._content, this._updatableContent);
			this._cleanDiffData = true;
			return this._diffData?.length > 0;
		}
	}

	getDiffData(): Array<{ [key: string]: any }> {
		if (this.hasDiff()) {
			return this._diffData;
		}
		return null;
	}

	// The returned Diff Object will have deleted keys set to null and changed keys. The rest of the keys do not
	// appear in the diff object. If the two objects do not have the same _gDocObjID, then a null is returned.
	// This diff flattens all objects (no matter how deep) into an array of differences. 
	// Flattening is done this way so that when one user moves an object, and a second user edits that object - if they both
	// save at the same time, it's less likely that the second write will clobber the first.
	static objDiff(sourceObj: { [key: string]: any }, targetObj: { [key: string]: any }): Array<{ [key: string]: any }> {
		let diffArray: Array<{ [key: string]: any }>;
		const diffObject: { [key: string]: any } = {};

		// Check that these objects have the same ID. IF they don't, refuse to compare by returning null
		if (!JsonFile.haveSameId(sourceObj, targetObj)) {
			return null;
		}

		diffObject._gDocObjID = sourceObj._gDocObjID;

		// Loop through the source object, don't deep compare objects just check their _gDocObjID.
		// We want to capture movement and deletion.
		for (let key in sourceObj) {
			// Make sure the value not inherited (etc)
			if (sourceObj.hasOwnProperty(key)) {
				// If the target has this key (and it's not a function), then compare - otherwise set null in diffObject
				if (targetObj[key] != null && Object.prototype.toString.call(targetObj[key]) !== "[object Function]") {
					// If they're not the same type
					if (Object.prototype.toString.call(sourceObj[key]) !== Object.prototype.toString.call(targetObj[key])) {
						if (Array.isArray(targetObj[key])) {
							// moved/new array is treated as a diff against an empty array
							diffObject[key] = JsonFile.arrayDiff([], targetObj[key]);
						} else {
							diffObject[key] = targetObj[key];
						}
					}
					// if the're both objects
					else if (JsonFile.isObject(sourceObj[key]) && JsonFile.isObject(targetObj[key])) {
						if (!JsonFile.haveSameId(sourceObj[key], targetObj[key])) {
							diffObject[key] = targetObj[key];
						}
					}
					// if they're both arrays
					else if (Array.isArray(sourceObj[key]) && Array.isArray(targetObj[key])) {
						const arrayDiff = JsonFile.arrayDiff(sourceObj[key], targetObj[key]);
						if (arrayDiff) {
							diffObject[key] = arrayDiff;
						}
					}
					// if they're both other values
					else if (sourceObj[key] != targetObj[key]) {
						diffObject[key] = targetObj[key];
					}
				} else {
					diffObject[key] = null;
				}
			}
		}

		// Loop through the target object and find missing items
		for (let key in targetObj) {
			if (targetObj.hasOwnProperty(key)) {
				// find missing items
				if (sourceObj[key] == null) {
					if (Array.isArray(targetObj[key])) {
						// new array is treated as a diff against an empty array
						diffObject[key] = JsonFile.arrayDiff([], targetObj[key]);
					} else {
						diffObject[key] = targetObj[key];
					}
				}
			}
		}

		// Check if diffObject belongs in DiffArray and initialize DiffArray;
		(JsonFile.objPropertySize(diffObject) > 1) ? diffArray = [diffObject] : diffArray = [];

		// Compare all objects in the target object
		// We don't care about placement.
		for (let key in targetObj) {
			if (targetObj.hasOwnProperty(key)) {
				// deep compare all objects
				if (JsonFile.isObject(targetObj[key])) {
					if (targetObj[key]?._gDocObjID > -1) {
						const compareObj = JsonFile.getChildWithId(targetObj[key]._gDocObjID, sourceObj);
						if (compareObj) {
							diffArray = [...diffArray, ...JsonFile.objDiff(compareObj, targetObj[key])];
						}
					}
				}
			}
		}

		return diffArray;
	}

	// Count the properties on an object
	static objPropertySize(val: {}): number {
		let count = 0;
		for (let k in val) {
			if (val.hasOwnProperty(k)) {
				++count;
			}
		}
		return count;
	}

	// What would you have to do to arr1 in order to create arr2?
	// This diff does not care about array order.
	static arrayDiff(sourceArr: Array<any>, targetArr: Array<any>): { _gDocObjID: number, addValues: Array<any>, removeValues: Array<any> } {
		const array1minus2 = (array1: Array<any>, array2: Array<any>): Array<any> => {
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
					index = array2.findIndex(v => val?._gDocObjID > -1 && val?._gDocObjID === v?._gDocObjID);
					return index < 0;
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

		const returnObj = {
			_gDocObjID: this.ARRAY_DIFF_ID_VALUE,
			addValues: array1minus2(targetArr, sourceArr),
			removeValues: array1minus2(sourceArr, targetArr)
		};

		if (returnObj.addValues.length > 0 || returnObj.removeValues.length > 0) {
			return returnObj;
		}
		return null;
	}

	static getChildWithId(id: number, anything): object {
		if (Array.isArray(anything)) {
			for (let val of anything) {
				const rtn = JsonFile.getChildWithId(id, val);
				if (rtn) return rtn;
			}
		} else if (JsonFile.isObject(anything)) {
			if (anything?._gDocObjID === id) return anything;
			for (let key in anything) {
				if (anything.hasOwnProperty(key)) {
					const rtn = JsonFile.getChildWithId(id, anything[key]);
					if (rtn) return rtn;
				}
			}
		}
		return null;
	}

	static isObject(tst) {
		return Object.prototype.toString.call(tst) === '[object Object]';
	}

	static haveSameId(sourceObj, targetObj): boolean {
		return (sourceObj?._gDocObjID > -1 && sourceObj._gDocObjID === targetObj?._gDocObjID);
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
