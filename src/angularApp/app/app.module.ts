//import { WorkerAppModule	} from '@angular/platform-webworker';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from '@Components/app.component';
import { NamePickerDialog } from '@Components/Dialogs/NamePickerDialog'; 
import { ConnectingDialog } from '@Components/Dialogs/ConnectingDialog'; 
import { CallDialog } from '@Components/Dialogs/CallDialog'; 
import { PhotoBoot } from '@Components/Dialogs/PhotoBoot'; 
import { DialDialog } from '@Components/Dialogs/DialDialog'; 
import { ReconnectDialog } from '@Components/Dialogs/ReconnectDialog'; 
import { ConnectedPeer } from '@Components/ConnectedPeer'; 
import { Message } from '@Components/Message'; 
import { Quote } from '@Components/Quote'; 
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { MaterialImports } from '@Components/MaterialImports';
import { ContenteditableModule } from 'ng-contenteditable';


@NgModule({
	declarations: [
		AppComponent,
		NamePickerDialog,
		ConnectingDialog,
		ReconnectDialog,
		CallDialog,
		DialDialog,
		PhotoBoot,
		ConnectedPeer,
		Message,
		Quote
	],
	entryComponents: [
		NamePickerDialog,
		ConnectingDialog,
		ReconnectDialog,
		CallDialog,
		PhotoBoot,
		DialDialog
	],
	imports: [
		//WorkerAppModule ,
		BrowserAnimationsModule,
		BrowserModule.withServerTransition({appId: 'app-root'}),
		ContenteditableModule,
		FormsModule,
		MaterialImports,
		HttpClientModule,
		AppRoutingModule,
		ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
