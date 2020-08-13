import { JsonFile } from './json-file';

export class GloomFile {

    readonly type: string;
    readonly isGloomy: boolean;
    readonly isCampaign: boolean;
    readonly isCharacter: boolean;

    constructor(public file: JsonFile) {

        this.type = this.inferType(file);
        this.isCampaign = this.type === "Campaign";
        this.isCharacter = this.type === "Character";
        this.isGloomy = this.isCampaign || this.isCharacter;
    }

    inferType(file: JsonFile): string {
        if (!file.content) return "Empty";

        if (file.content.Campaign) {
            if (file.content.Campaign.name
                && typeof file.content.Campaign.name.length === 'string') {
                return "Campaign";
            } else {
                return "Campaign Format Error";
            }
        }

        if (file.content.Character) {
            if (file.content.Character.name
                && typeof file.content.Character.name === 'string'
                && file.content.Character.class
                && typeof file.content.Character.class === 'string') {
                return "Character";
            } else {
                return "Character Format Error";
            }
        }

        if (file.content.Error) return "General Parsing Error";

        return "Unknown";
    }

}