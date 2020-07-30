import { Component, OnInit } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-picker.service';
import { GoogleFileManagerService } from 'src/app/service/google-file-manager.service';
import { JsonFile } from 'src/app/model_data/json-file';

@Component({
  selector: 'app-google-picker',
  templateUrl: './google-picker.component.html',
  styleUrls: ['./google-picker.component.scss']
})
export class GooglePickerComponent implements OnInit {

  testFile: JsonFile;
  testObj = {
    'id': 0,
    'Campaign': {
      'id': 1,
      'Name': "testing campaign",
      'GlobalAchievements': [
        "One",
        "Two",
        "Three"
      ],
      'Parties': [{
        'id': 2,
        'Name': "testing party 1"
      },{
        'id': 3,
        'Name': "testing party 2"
      }]
    }
  };
  testObj2 = {
    'id': 0,
    'Campaign': {
      'id': 1,
      'Name': "testing2 campaign2",
      'GlobalAchievements': [
        "One2",
        "Two2",
        "Three2"
      ],
      'Parties': [{
        'id': 2,
        'Name': "testing party 1-2"
      },{
        'id': 3,
        'Name': "testing party 2-2"
      }]
    }
  };

  constructor(
    private oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService, 
    private googleFileLoader: GoogleFileManagerService){
      
  }

  ngOnInit(): void {
  }

  listFiles(){
    this.googleFileLoader.listAllAccessibleFiles();
  }

  loadGooglePicker(){
    this.googlePicker.showGloomtoolsGooglePicker();
  }

  getUserObj(){
    this.oauthService.getUserName().subscribe({
      next: userName => {
        console.log("UserName: ", userName);
      }
    });
  }

  signOut(){
    this.oauthService.signOut();
  }

  revokeAccess(){
    this.oauthService.revokeAccess();
  }

  createFile(){
    this.googleFileLoader.createNewJsonFile("HeyThere2", this.testObj).subscribe({
      next: file => {
        console.log("createNewJsonFile: ", file);
        this.testFile = file;
      },
      error: err => console.log("Error!", err),
      complete: () => console.log("Completed createNewJsonFile()")
    });

  }

  updateFile(){
    const file = this.testFile;
    if(file){
      file.name = "ThisIsANewName-gloomtools.json"
      file.content = this.testObj2;
      this.googleFileLoader.saveJsonFile(file).subscribe({
        next: fileI => console.log("UpdatedFile: ", fileI),
        error: console.error,
        complete: () => console.log("saveJsonFile() complete")
      });
      console.log("called googleFileLoader.saveJsonFile");
    }else{
      console.log("No test File created yet");
    }
  }

  updateFileMetaData(){
    const file = this.testFile;
    if(file){
      file.name = "ThisIsANewNameMEATADATA-gloomtools.json"
      file.content = this.testObj2;
      file.active = false;
      this.googleFileLoader.saveJsonFileMetadata(file).subscribe({
        next: fileI => {
          console.log("UpdatedFile: ", fileI);
        },
        error: console.error,
        complete: () => console.log("updateFileMetaData() complete")
      });
      console.log("called googleFileLoader.saveJsonFile");
    }else{
      console.log("No test File created yet");
    }
  }

  setFolder(){
    this.googleFileLoader.getGloomtoolsFolderId().subscribe({
      next: id => console.log("getGloomtoolsFolderId(): ", id)
    });
  }

  loadFiles(){
    this.googleFileLoader.loadAllAccessibleFiles().subscribe({
      complete: ()=>console.log("loadAllAccessibleFiles() Complete")
    });
  }

  listLoadedFiles(){
    this.googleFileLoader.listAllLoadedFiles();
  }
}
