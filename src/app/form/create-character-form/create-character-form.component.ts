import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { DataService } from 'src/app/service/data.service';
import { ClassDataService } from 'src/app/service/class-data.service';
import { ImgIcon } from 'src/app/json_interfaces/img-icon';

@Component({
  selector: 'app-create-character-form',
  templateUrl: './create-character-form.component.html',
  styleUrls: ['./create-character-form.component.scss'],
})
export class CreateCharacterFormComponent implements OnInit {
  @Output() newDocId: EventEmitter<string> = new EventEmitter<string>();

  classIcons = new Array<ImgIcon>();

  newCharacterForm = new FormGroup({
    newCharacterName: new FormControl(''),
    newCharacterClass: new FormControl(''),
  });

  constructor(private data: DataService, private classData: ClassDataService) {
    this.classIcons = classData.getClassIcons();
  }

  ngOnInit(): void {}

  createNewCharacter(): void {
    console.log(this.newCharacterForm.value);
  }
}
