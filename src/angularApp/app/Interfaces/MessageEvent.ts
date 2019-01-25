import Event from "@Interfaces/Event";

interface Message{
	message? : string,
	quote? : string,
	media? : string
}

export default interface MessageEvent extends Event{
	payload : Message;
}; 