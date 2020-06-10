import { Injectable } from '@angular/core';

/**
 * This is the service class that keeps tabs on all current selections in the app
 */
@Injectable({
  providedIn: 'root'
})
export class SelectionService {

  party: string;
  partyVisit: string;
  character: string;
  characterVisit: string;

  constructor() { }
}
