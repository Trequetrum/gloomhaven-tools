import { BreakpointObserver } from '@angular/cdk/layout';

export class JsonFile {

    readonly mimeType = "application/json";
    originalContent: any;
    content: any;

    constructor(
        public id?: string,
        public name?: string,
        public canEdit?: boolean,
        public modifiedTime?: string,
        public active = false
    ){}

    setContents(contents: any) : void{
        this.content = contents;
        this.originalContent = contents;
    }

    generateNewObjectId(): number {
        const listIds = new Array<number>();

        if(this.content){
            for (let key in this.content) {
                if (this.content.hasOwnProperty(key) && this.content[key].id) {
                    listIds.push(this.content[key].id);
                }
            }
        }

        listIds.sort((a, b) => a - b);

        let newId = 0;
        let i = 0;
        while(i < listIds.length){
            if(newId < listIds[i]) break;
            else if(newId == listIds[i]){
                newId++;
                i++;
            }else{
                i++;
            }
        }

        return newId;
    }

    contentAsString(origional: boolean, pretty: boolean): string{
        const contents = origional? this.originalContent : this.content; 

        if(contents && pretty)
            return JSON.stringify(contents, null, 2);
        if(contents)
            return JSON.stringify(contents);

        return "";
    }

}
