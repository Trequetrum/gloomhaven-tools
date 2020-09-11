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
