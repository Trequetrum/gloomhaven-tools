import { Injectable } from '@angular/core';
import { Character } from '../model_data/character';

@Injectable({
  providedIn: 'root'
})
export class CharactersService {

  userCharacters: Array<Character>;
  userCharacterTitles: Array<Character>;

  UserCampaignTitles: Array<string>;

  constructor() { 
    // For now, create some dummy data on creation
    var char1 = new Character();
    char1.name = "Timmy";
    this.userCharacters.push(char1);

    var char2 = new Character();
    char2.name = "Tommy";
    this.userCharacters.push(char1);

    var char3 = new Character();
    char3.name = "JoeBob";
    this.userCharacters.push(char1);
  }

  getAllNamesUser(): string[]{
    var names: string[];
    this.userCharacters.forEach(i => {
        names.push(i.name);
      }
    );
    return names;
  }

  getByNameUser(name: string): Character{
    this.userCharacters.forEach(i => {
        if(i.name == name){
          return i;
        }
      }
    );
    return null;
  }

  getAllNamesByParty(PartyURI: string): string[]{
    return ["one", "two", "three"];
  }

  getByPartyAndName(PartyURI: string, name: string): Character{
    return new Character();
  }
}
