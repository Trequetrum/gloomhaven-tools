import { Character } from '../json_interfaces/character';
import { JsonFile } from './json-file';
import { GloomFile } from './gloom-file';

export class CharacterFile extends GloomFile {

    constructor(file: GloomFile, check = true) {
        super(file);
        if (check && !(file.isCharacter)) throw new Error("Given JsonFile does not contain a Gloomhaven Character");
    }

    get character(): Character {
        return this.content.Character;
    }
}
