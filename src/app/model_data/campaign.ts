import { Party } from './party';
import { CampaignMini } from './campaign-mini';
import { PartyMini } from './party-mini';
import { GlobalAchievement } from './achievement';

export class Campaign {

    public parties = new Array<PartyMini>()

    constructor(
        public id?: number,
        public edit?: boolean,
        public name?: string,
        public globalAchievements = new Array<GlobalAchievement>()){}

    /* This is not a production-level function. It's just so that fake data is easier to
        initialize in the data-memory-service. For development use only.
    */
    dev_returnMini(): CampaignMini{
        let partyMinis = new Array<PartyMini>();
        this.parties.forEach(prty => {
            partyMinis.push(new PartyMini(prty.id, prty.name));
        })
        return new CampaignMini(this.id, this.name, partyMinis);
    }
}
