import { BreakpointObserver } from '@angular/cdk/layout';

export class JsonFile {

    mimeType = "application/json";

    constructor(
        public id?: string,
        public modifiedTime?: string,
        public name?: string,
        public content?: any
    ){}

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

    contentAsString(pretty: boolean): string{
        if(this.content && pretty)
            return JSON.stringify(this.content, null, 2);
        if(this.content)
            return JSON.stringify(this.content);

        return "";
    }

}
