import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-create-character-form',
  templateUrl: './create-character-form.component.html',
  styleUrls: ['./create-character-form.component.scss']
})
export class CreateCharacterFormComponent implements OnInit {

  newCharacterForm = new FormGroup({
    newCharacterName: new FormControl(''),
    newCharacterClass: new FormControl('')
  });
  
  constructor() { }

  ngOnInit(): void {
  }

  createNewCharacter(): void{
    console.log(this.newCharacterForm.value);
  }

}
