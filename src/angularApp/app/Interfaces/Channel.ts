import { Presentation } from "@Interfaces/Events/PresentationEvent";

export default interface Channel {
	readonly id? : string;
	readonly connectedClients? : number;
	readonly clients? : string[];
	readonly presentation? : Presentation[];
};