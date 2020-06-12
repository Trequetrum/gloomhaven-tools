import { Campaign } from './campaign';
import { PartyMini } from './party-mini';

export class Party {
    constructor(
        public id: number,
        public edit: boolean,
        public name:string){ }
    
    dev_returnMini(): PartyMini{
        return new PartyMini(this.id, this.name);
    }
}
