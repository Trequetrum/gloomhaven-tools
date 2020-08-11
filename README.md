# GloomhavenTools

Learning Angular and building a Gloomhaven app at the same time :)

## Documentation:

There’s no official documentation yet. The code should be written/maintained in a 
reasonably well documented state in the master branch. Usage details/documentation 
is a must-have for once the first features are implemented and friends are 
checking it out and giving feedback.

The most recent production build can be found at: 
https://trequetrum.github.io/GloomhavenTools/. 
    - The last build was Tue August 11th 2020. It has basic Google Drive 
      Sign in implemented with some very basic document management. 

## Features for this project:
* Glorified Gloomhaven document editor with built-in collaboration
    * Share info with friends by sharing Google Drive documents. 
    (In this way, Read/Write permissions are handled via GDrive)
* Keep track of your Gloomhaven character
* Keep track of your Campaign and Parties as a group
    * Keep track of an active scenario as a group

## Learning goals for this project:
    * Consume Google Drive V3 REST API to read and save user data
    * Patch semantics and automatic merge conflict resolution for updates
    * Change detection via Polling (Time cleverly if possible.) 
    * Push notifications would be nice but Github is a static page, 
      so it doesn't support a webhook callback.
    * TypeScript/Javascript is multiparadigm: Prefer functional 
      over imperative
 	    * Map data as streams from API calls to displayed values via 
          Observables & Angular Pipes 
    * Follow Angular’s framework: 
        * Keep code modular
        * Testing!
        * Package size quotas to keep app loading fast(er)/reasonable
    * [ . . . ]

## Notes
    1. Command to build for GitHub Pages :)
        * ng build --prod --output-path docs --base-href /GloomhavenTools/

# Angular Development

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
