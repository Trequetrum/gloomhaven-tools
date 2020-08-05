import { isArray } from 'util';

export class JsonFile {

    readonly mimeType = "application/json";
    private content: any;
    private currGDocID = 0;

    constructor(
        public id?: string,
        public name?: string,
        public canEdit?: boolean,
        public modifiedTime?: string
    ){}

    clone(): JsonFile {
        const file = new JsonFile(this.id, this.name, this.canEdit, this.modifiedTime)
        file.setContent(JSON.parse(JSON.stringify(this.content)), false);
        return file;
    }

    isObject(tst){ 
        return Object.prototype.toString.call(tst) === '[object Object]';
    }

    getContent(): any {
        return this.content;
    }

    setContent(content: any, genIds = true){
        if(genIds){
            this.currGDocID = 0;
            this.mutateAddIds(content);
        }
        this.content = content;
    }

    mutateAddIds(anything){
        if(Array.isArray(anything)){

            anything.forEach((val) => this.mutateAddIds(val));

        }else if(this.isObject(anything)){

            anything._gDocID = this.currGDocID++;
            for (let key in anything) {
                if (anything.hasOwnProperty(key)){
                    this.mutateAddIds(anything[key]);
                }
            }

        }
    }

    mutateRemoveIds(anything){
        if(Array.isArray(anything)){

            anything.forEach((val) => this.mutateRemoveIds(val));

        }else if(this.isObject(anything)){

            delete anything._gDocID;
            for (let key in anything) {
                if (anything.hasOwnProperty(key)){
                    this.mutateRemoveIds(anything[key]);
                }
            }
        }
    }

    contentAsString(pretty: boolean): string{
        this.mutateRemoveIds(this.content);

        if(this.content && pretty)
            return JSON.stringify(this.content, null, 2);
        if(this.content)
            return JSON.stringify(this.content);

        return "";
    }

}
