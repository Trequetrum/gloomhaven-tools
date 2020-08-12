import { JsonFile } from './json-file';

export class GloomFile {

    readonly type: string;
    readonly isGloomy: boolean;
    readonly isCampaign: boolean;
    readonly isCharacter: boolean;

    constructor(public file: JsonFile){
        this.type = this.inferType(file);
        this.isCampaign = this.type === "Campaign";
        this.isCharacter = this.type === "Character";
        this.isGloomy = this.isCampaign || this.isCharacter;
    }

    inferType(file: JsonFile): string{
        if(!file.getContent()) return "Empty";
        
        if( file.getContent().Campaign && 
            file.getContent().Campaign.name &&
            file.getContent().Campaign.name.length > 0) 
            return "Campaign";

        if( file.getContent().Character
            && file.getContent().Character.name 
            && typeof file.getContent().Character.name === 'string' 
            && file.getContent().Character.class 
            && typeof file.getContent().Character.class === 'string') 
            return "Character";

        if(file.getContent().Error) return "Parsing Error";
        
        return "Unknown";
    }

}