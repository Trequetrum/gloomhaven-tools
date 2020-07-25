import { Component, OnInit } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-picker.service';
import { GoogleFileManagerService } from 'src/app/service/google-file-manager.service';

@Component({
  selector: 'app-google-picker',
  templateUrl: './google-picker.component.html',
  styleUrls: ['./google-picker.component.scss']
})
export class GooglePickerComponent implements OnInit {

  testObj = {
    "Campaign": {
      "Name": "testing campaign",
      "GlobalAchievements": [
        "One",
        "Two",
        "Three"
      ],
      "Parties": [{
        "Name": "testing party 1"
      },{
        "Name": "testing party 2"
      }]
    }
  };

  constructor(
    private oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService, 
    private googleFileLoader: GoogleFileManagerService){}

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
    /*
    this.googleFileLoader.createNewJsonFile_old("HeyThere3").subscribe({
      next: file => console.log("createNewJsonFile: ", file),
      complete: () => {console.log("Completed createNewJsonFile()")}
    });*/

    this.googleFileLoader.createNewJsonFile("HeyThere2", this.testObj).subscribe({
      next: file => console.log("createNewJsonFile: ", file),
      error: err => console.log("Error!", err),
      complete: () => {console.log("Completed createNewJsonFile()")}
    });

  }

  setFolder(){
    this.googleFileLoader.getGloomtoolsFolderId().subscribe({
      next: id => console.log("getGloomtoolsFolderId(): ", id)
    });
  }
}
