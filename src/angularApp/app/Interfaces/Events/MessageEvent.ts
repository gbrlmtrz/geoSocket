import Event from "@Interfaces/Event";
import { Presentation } from "@Interfaces/Events/PresentationEvent"

export interface Message{
	id? : string,
	message? : string;
	quote? : Message;
	media? : any;
	sender? : Presentation;
	byMe? : boolean;
	firstOf? : boolean;
	date? : number;
	recieved? : boolean;
}

export interface MessagePayload{
	id? : string,
	message? : string,
	media? : any,
	quote? : string,
	date? : number
}; 

export default interface MessageEvent extends Event{
	payload : MessagePayload;
};  