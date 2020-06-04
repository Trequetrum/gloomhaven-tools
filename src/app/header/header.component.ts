import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InputInitiativeComponent } from '../dialog/input-initiative/input-initiative.component';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
  }

  openInitiativeDialog(): void {
    const dialogRef = this.dialog.open(InputInitiativeComponent);
    dialogRef.afterClosed().subscribe(result => {
        console.log(`TODO: EMIT initiative=${result}`);
    })
  }

}
