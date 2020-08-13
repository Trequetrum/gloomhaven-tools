import { Character } from '../json_interfaces/character';
import { JsonFile } from './json-file';
import { GloomFile } from './gloom-file';

export class CharacterFile {

    constructor(public file: JsonFile, check = true) {
        if (check && !(new GloomFile(file).isCharacter)) throw new Error("Given JsonFile does not contain a Gloomhaven Character");
    }

    get character(): Character {
        return this.file.content.Character;
    }
}
