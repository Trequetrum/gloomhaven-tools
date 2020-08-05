import { PartyMini } from './party-mini';

export class CampaignMini {
    constructor(
        public docId: string,
        public name: string, 
        public parties = new Array<string>()){}
}
