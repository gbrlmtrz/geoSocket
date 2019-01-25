# geoSocket

## ToDo server
- Very High
	- [x] Force one connection per browser
		- [ ] Make it per device?
	- [x] When about to select a channel, get the number of connected poeple. If there is a channel that is close to the max (defined by the config file), and there is a new client, move some of the biggest channels clients to a new channel
	- [x] When a client disconnects, if the channel is bellow a threshhold, send its clients to other channels to populate them
- High
	- [x] Merge state from incoming event, with stored in memory state of a client
	- [x] Use Cloudant to save channel and geo query them
	- [x] Use Redis to mantain socket state
	- [x] Use Redis pub/sub as a broker between instances, so messages are properly replicated
	- [x] Make each server responsable for mantaining the state of the channels they create
	- [x] In case said server dies, using a hearbeat make other servers take responsability for it
	- [x] Bottleneck the updates to redis/cloudant to avoid collisions 
- Medium
	- [x] Get state of a channel through redis
- Low
	- [ ] Recieve git pushes, then do a pull, then reload pm2 instance
	- [x] Set an interval to store all states in cloudant every X seconds

	
## ToDo pwa
- Very High
	- [X] PWA
	- [X] Generate ID for the browser 
		- [ ] For the device?
	- Optional
		- [ ] Run it in a WebWorker?
	- [x] Get browser fingerprint
- High
	- [ ] Mobile Friendly
	- [ ] Emoji keyboard support
- Medium
	- [X] Socket connection in the WebWorker
- Low
	- [ ] Facebook login, just retrieve photo and name
	
	
# GeoSocketClient

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.2.1.

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

To get more help on the Angular CLI use `ng help` or go c