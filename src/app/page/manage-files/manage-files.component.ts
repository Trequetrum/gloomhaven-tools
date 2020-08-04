import { Component, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { GoogleOauth2Service } from 'src/app/service/google-oauth2.service';
import { GooglePickerService } from 'src/app/service/google-picker.service';
import { GoogleFileManagerService } from 'src/app/service/google-file-manager.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';
import { JsonFile } from 'src/app/model_data/json-file';

@Component({
  selector: 'app-manage-files',
  templateUrl: './manage-files.component.html',
  styleUrls: ['./manage-files.component.scss']
})
export class ManageFilesComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['name', 'edit', 'type', 'loaded', 'sync'];
  dataSource = new MatTableDataSource();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatTable, {static:false}) table: MatTable<any>;

  constructor(
    public oauthService: GoogleOauth2Service,
    private googlePicker: GooglePickerService, 
    private googleFileLoader: GoogleFileManagerService){}

  ngOnInit() {
    // Set initial files
    this.dataSource.data = Array.from(this.googleFileLoader.currentDocuments.values());
  }

  ngAfterViewInit(){
    // Set Sort
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (file: JsonFile, columnDef: string) => {
      switch (columnDef) {
        case 'name': return file.name.toLowerCase();
        case 'edit': return file.canEdit? 0 : 1;
        case 'type': return this.inferType(file).toLowerCase();
        case 'sync': return 0;
        case 'loaded': return 0;
        default: return file[columnDef];
      }
    };
    // Listen for updates to files
    this.googleFileLoader.listenLoadedFiles().subscribe(val => this.updateDataSource(val));
  }

  renderTableRows(){
    // This line really should work, but I just CAN NOT figure it out.
    // this.table.renderRows();

    // The work around is to create a shallow copy of the array and trigger re-rendering that way
    this.dataSource.data = this.dataSource.data.slice();
  }

  load(load: boolean, file: JsonFile){
    if(load)
      console.log("Load " + file.name);
    else
      console.log("unload " + file.name);
  }

  updateDataSource({load, file}) {

    if(load){
      this.dataSource.data.push(file);
    }else{
      const i = this.dataSource.data.indexOf(file);
      if(i >= 0){
        this.dataSource.data = this.dataSource.data.splice(i, 1);
      }
    }

    this.renderTableRows()
  }
  
  updateDataSourcetst(){
    this.dataSource.data.push(new JsonFile("ID", "Tahomas", false, "Bleh"));
    this.renderTableRows();
  }

  logIn(){
    this.oauthService.getUserName().subscribe();
  }

  loadGooglePicker(){
    this.googlePicker.showGloomtoolsGooglePicker();
  }

  inferType(file: JsonFile): string{
    if(!file.content) return "Empty";
    if(file.content.Campaign) return "Campaign";
    if(file.content.Character) return "Character";
    return "Unknown";
  }

  logDate(){
    console.log(new Date().toString());
  }

}
