import { Character } from '../json_interfaces/character';
import { JsonFile } from './json-file';
import { GloomFile } from './gloom-file';

export class CharacterFile extends GloomFile {

    constructor(file: GloomFile) {
        super(file);
        if (!this.isCharacter){
            this.content.Character = { 
                Error: {
                    type: "Casting",
                    message: "Drive document " + file.id + " does not contain a Gloomhaven Character",
                }
            };
        }
    }

    get character(): Character {
        return this.content.Character;
    }
}
