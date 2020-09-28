import { identity } from 'rxjs';
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
	static readonly DIFF_OBJ_NEW_ID = -9;
	static readonly MIME_TYPE = "application/json";
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
		this.content = { _gDocObjID: 0 };
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
		if (this._updatableContent == null && this._content != null)
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
		if (content != null && !content._gDocObjID)
			JsonFile.mutateAddIds(content);
		this._content = content;
	}

	// Return a JSON string of the content. Content should be safe to serialize into
	// JSON, wso we don't both with checking that here (For now).
	contentAsString(pretty: boolean): string {
		const content = this._updatableContent != null ? this._updatableContent : this._content;
		return (content != null && pretty) ? JSON.stringify(content, null, 2) : JSON.stringify(content);
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

	// If there are differences between content and updatable content, return that data
	getDiffData(): Array<{ [key: string]: any }> {
		if (this.hasDiff()) {
			return this._diffData;
		}
		return null;
	}

	// Patch the given content with the given diff array
	static diffPatch(content: any, diffs: Array<{ [key: string]: any }>): void {
		// If we patch out an object, a later diff may patch it back in.
		// Therefore we hold on to all removed objects until the patch
		// has been completely applied.
		const droppedObjs = new Array<Object>();

		const getObjectById = (id: number): object => {
			// Find it in the content we're patching
			let find = JsonFile.getChildWithId(id, content);
			// Find it in our array of dropped objects
			if (find == null) find = JsonFile.getChildWithId(id, droppedObjs);
			return find;
		}

		// Apply each diff one after another
		diffs.forEach(diff => {

			if (!(JsonFile.isObject(diff) && diff?._gDocObjID >= 0)) {
				console.log(">>>>> JsonFile Patch Warning: Found diff without _gDocObjID. Ignoring: ", diff);
				return;
			}

			const updateObj = getObjectById(diff._gDocObjID);
			if (updateObj == null) {
				console.log(">>>>> JsonFile Patch Warning: Diff object not found in target. Ignoring: ", diff);
				return;
			}

			for (let key in diff) {
				// If it's an exsiting object it must have a positive _gDocObjID
				if (diff[key]?._gDocObjID > -1) {
					// If we're replacing an exising object, keep a reference to it in case we need it later
					if (JsonFile.isObject(updateObj[key])) {
						droppedObjs.push(updateObj[key]);
					}
					const update = getObjectById(diff[key]._gDocObjID);
					if (update != null) {
						updateObj[key] = update;
					} else {
						console.log(">>>>> JsonFile Patch Warning: Diff object for key (" + key + ") not found in target. Ignoring: ", diff);
					}
					// If it's a new object, it's an object with a special _gDocObjID
				} else if (diff[key]?._gDocObjID == JsonFile.DIFF_OBJ_NEW_ID) {
					// If we're replacing an object, keep a reference to it in case we need it later
					if (JsonFile.isObject(updateObj[key])) {
						droppedObjs.push(updateObj[key]);
					}
					updateObj[key] = diff[key];
					// If it's an array diff, it's an object with a special _gDocObjID
				} else if (diff[key]?._gDocObjID == JsonFile.ARRAY_DIFF_ID_VALUE) {
					// We force this key to contain an array, so if it isn't an array already, we need to
					// turn it into an empty array.
					if (!Array.isArray(updateObj[key])) {
						// If we're replacing an object, keep a reference to it in case we need it later
						if (JsonFile.isObject(updateObj[key])) {
							droppedObjs.push(updateObj[key]);
						}
						updateObj[key] = new Array<any>();
					}

					// Splice out removed values
					if (diff[key]?.removeValues?.length > 0) {
						// If we're removing an object, keep a reference to it in case we need it later
						diff[key].removeValues.forEach(val => {
							if (val?._gDocObjID > -1) {
								droppedObjs.push(getObjectById(val._gDocObjID));
							}
						});
						// Remove values using diff array
						updateObj[key] = JsonFile.array1minus2(updateObj[key], diff[key].removeValues);
					}

					// Push added values
					if (diff[key]?.addValues?.length > 0) {
						diff[key].addValues.forEach(val => {
							// If we're adding an existing object, the diff only has a reference, we need to retrieve the
							// actual object.
							if (val?._gDocObjID > -1) {
								let find = getObjectById(val._gDocObjID);
								// Push the object if we found one. Otherwise print a warning
								if (find != null) {
									updateObj[key].push(find);
								} else {
									console.log(">>>>> JsonFile Patch Warning: diff ref object not found: ", val);
								}
							} else {
								updateObj[key].push(val);
							}
						});
					}

					// If we're this far, it shouldn't be an object or a function, just just replace the current
					// value with the new one
				} else if (!JsonFile.isObject(diff[key]) && !JsonFile.isFunction(diff[key])) {
					updateObj[key] = diff[key];
				} else {
					// Log a warning. Functions and objects with negative or missing ids should end up here
					console.log(">>>>> JsonFile Patch Warning: Unexpected key (" + key + "). Ignoring on: ", diff);
				}
			}
		});
	}

	// The returned Diff Object will have deleted keys set to null and changed keys. The rest of the keys do not
	// appear in the diff object. If the two objects do not have the same _gDocObjID, then a null is returned.
	// This diff flattens all objects (no matter how deep) into an array of differences. 
	// Flattening is done this way so that when one user moves an object, and a second user edits that object - if they both
	// save at the same time, it's less likely that the second write will clobber the first.
	static objDiff(sourceObj: { [key: string]: any }, targetObj: { [key: string]: any }): Array<{ [key: string]: any }> {
		let diffArray: Array<{ [key: string]: any }>;
		const diffObject: { [key: string]: any } = {};

		// Any new or moved objects can be added to the diff with this function as we discover them
		const addTargetToDiffByKey = (key: string) => {
			// If the target has a new object, it will either not have an id or
			// it'll have an id designated for new objects. We mark it as a new object and put the entire object 
			// in the diff.
			if (targetObj[key]._gDocObjID == null || targetObj[key]._gDocObjID == JsonFile.DIFF_OBJ_NEW_ID) {
				targetObj[key]._gDocObjID = JsonFile.DIFF_OBJ_NEW_ID;
				diffObject[key] = targetObj[key];
			} else if (targetObj[key]._gDocObjID > -1) {
				// Remember that this is a shallow compare, so objects that arn't new are represented by just their ID
				// since patching with move an object with this ID regardless of its values.
				diffObject[key] = {
					'_gDocObjID': targetObj[key]._gDocObjID
				};
			} else {
				console.log(">>>>> JsonFile Patch Warning: Ignoring target diff object with bad _gDocObjID ", targetObj[key]);
			}
		}

		// Check that these objects have the same ID. IF they don't, refuse to compare by returning null
		if (!JsonFile.haveSameId(sourceObj, targetObj)) {
			return null;
		}

		// The diffObject takes it's ID from the two objects it's diffing
		diffObject._gDocObjID = sourceObj._gDocObjID;

		// Loop through the source object, don't deep compare objects just check their _gDocObjID.
		// We want to capture movement and deletion.
		for (let key in sourceObj) {
			// Make sure the value not inherited (etc)
			if (sourceObj.hasOwnProperty(key)) {
				// If the target has this key (and it's not a function), then compare - otherwise set null in diffObject
				if (targetObj[key] != null && !JsonFile.isFunction(targetObj[key])) {
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
							addTargetToDiffByKey(key);
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
			if (targetObj.hasOwnProperty(key) && !JsonFile.isFunction(targetObj[key])) {
				// find missing items
				if (sourceObj[key] == null) {
					if (Array.isArray(targetObj[key])) {
						// new array is treated as a diff against an empty array
						diffObject[key] = JsonFile.arrayDiff([], targetObj[key]);
					} else if (JsonFile.isObject(targetObj[key])) {
						addTargetToDiffByKey(key);
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
		// An arraydiff is an object with a special _gDocObjID, when this type of object 
		// is associated with a key, that key's array is patched with the attached arraydiff
		const returnObj = {
			_gDocObjID: this.ARRAY_DIFF_ID_VALUE,
			addValues: JsonFile.array1minus2(targetArr, sourceArr),
			removeValues: JsonFile.array1minus2(sourceArr, targetArr)
		};

		// Only return a diff if there are differences
		if (returnObj.addValues.length > 0 || returnObj.removeValues.length > 0) {
			return returnObj;
		}

		return null;
	}

	static array1minus2(array1: Array<any>, array2: Array<any>): Array<any> {
		if (!Array.isArray(array1)) {
			return null;
		}
		if (!Array.isArray(array2)) {
			return array1;
		}
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
	}

	// If it's passed in an array or an object, this does a deep search looks for an object
	// with the supplied _gDocObjID
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

	static isFunction(tst) {
		return Object.prototype.toString.call(tst) === '[object Function]';
	}

	static haveSameId(sourceObj, targetObj): boolean {
		return (sourceObj?._gDocObjID > -1 && sourceObj._gDocObjID === targetObj?._gDocObjID);
	}

	static mutateAddIds(something: any): void {
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

		mutateIds(something);
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
