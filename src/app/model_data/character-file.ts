import { Character } from '../json_interfaces/character';

export class CharacterFile {
    constructor(
        public docId: string, 
        public character: Character){}
}
