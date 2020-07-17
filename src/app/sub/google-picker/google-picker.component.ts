import { Component, OnInit } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-picker.service';
import { GoogleLoadFileService } from 'src/app/service/google-load-file.service';

@Component({
  selector: 'app-google-picker',
  templateUrl: './google-picker.component.html',
  styleUrls: ['./google-picker.component.scss']
})
export class GooglePickerComponent implements OnInit {


  constructor(
    private oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService, 
    private googleFileLoader: GoogleLoadFileService){}

  ngOnInit(): void {
    this.googlePicker.gloomtoolsFileLoad$.subscribe({
      next: (document) => {
        console.log("document: ", document);
      }
    });

    console.log("this.googleFileLoader.hello", this.googleFileLoader.hello);
  }

  listFiles(){
    this.googleFileLoader.listAllAccessableFiles();
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

}
