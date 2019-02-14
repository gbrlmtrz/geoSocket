import Event from "@Interfaces/Event";

export interface Presentation{
	id? : string,
	name? : string,
	picture? : string,
	color? : string,
	nudging? : boolean,
	typing? : boolean,
	onCall? : boolean
}

export default interface PresentationEvent extends Event{
	payload : Presentation;
};  