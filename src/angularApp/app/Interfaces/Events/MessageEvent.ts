import Event from "@Interfaces/Event";
import { Photo } from "@Interfaces/Photo";
import { Presentation } from "@Interfaces/Events/PresentationEvent"

export interface Message{
	id? : string,
	message? : string;
	quote? : Message;
	media? : any;
	photo? : Photo;
	sender? : Presentation;
	byMe? : boolean;
	firstOf? : boolean;
	date? : number;
	recieved? : boolean;
}

export interface MessagePayload{
	id? : string;
	message? : string;
	media? : any;
	quote? : string;
	date? : number;
	photo? : Photo;
}; 

export default interface MessageEvent extends Event{
	payload : MessagePayload;
};  