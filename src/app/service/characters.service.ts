import { Injectable } from '@angular/core';
import { Character } from '../model/character';

@Injectable({
  providedIn: 'root'
})
export class CharactersService {

  characters:Character[];

  constructor() { 
    // For now, create some dummy data on creation
    

  }


}
