interface Coordinates {
	latitude : number;
	longitude : number;
	altitude : number;
	accuracy : number;
	altitudeAccuracy : number;
	heading : number;
	speed : number;
}

export default interface Position {
	coords : Coordinates;
	timestamp : number;
}