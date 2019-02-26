'use strict';
const config = require('config');
const db = require("../../database")("geosocket");
const googleMaps = require('@google/maps').createClient({
	key: config.get("google.mapsapikey"),
	Promise: Promise
});

const earthRadius = 6371000;

const getDistanceFromLatLonInMeters = function(lat1, lon1, lat2, lon2) {
	const dLat = deg2rad(lat2 - lat1);
	const dLon = deg2rad(lon2 - lon1); 
	const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
		Math.sin(dLon/2) * Math.sin(dLon/2);
	
	return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

const deg2rad = function(deg) {
	return deg * (Math.PI/180)
};

const calcDistance = function(lat, lon, geometry){
	switch(geometry.type){
		case "MultiPoint":
			const distances = [];
			for(const point of geometry.coordinates)
				distances.push(getDistanceFromLatLonInMeters(lat, lon, point[1], point[0]));
			return Math.min(...distances);
			break;
		case "Point":
		default:
			return getDistanceFromLatLonInMeters(lat, lon, geometry.coordinates[1], geometry.coordinates[0]);
			break;
	}
};

const findChannelByDistance = function(lat, lon, radius){
	return new Promise(function(resolve, reject){
		
		db.geo('channel', 'geochannel', {
			lat,
			lon,
			radius,
			relation: "intersects",
			include_docs: true,
			nearest: true
		}, cb);
		
		function cb(err, response){
			if(err){
				console.log(err);
				return resolve([]);
			}else{
				const docs = [];
				for(const row of response.rows){
					if(row.doc)
						docs.push({_id: row.doc._id, state: row.doc.state, geometry: row.doc.state.geometry, connectedClients: (row.doc.state.connectedClients || 0), distance: calcDistance(lat, lon, row.doc.state.geometry)});
				}
				if(docs.length > 1)
					docs.sort(sortByDistance);
				resolve(docs);
			}
		};
		
	});
};

const findChannelByIP = function(lat, lon, ip){
	return new Promise(function(resolve, reject){
		
		return resolve([]);
		db.search('channel', 'ipchannel', {
			q: `ip:${ip}`,
			include_docs: true
		}, cb);
		
		function cb(err, response){
			if(err){
				console.log(err);
				return resolve([]);
			}else{
				const docs = [];
				for(const row of response.rows){
					docs.push({_id: row.doc._id, state: row.doc.state, geometry: row.doc.state.geometry, connectedClients: (row.doc.state.connectedClients || 0), distance: calcDistance(lat, lon, row.doc.state.geometry)});
				}
				
				if(docs.length > 1)
					docs.sort(sortByDistance);
				
				resolve(docs);
			}
		};
		
	});
};

const sortByDistance = function(a, b){
	return a.distance - b.distance;
};

const findPlaceNearby = function(lat, lon, radius){
	return new Promise(function(resolve, reject){
		
		googleMaps.findPlace({
			fields: ["geometry", "name", "place_id"],
			input: "*",
			inputtype: "textquery",
			locationbias: `circle:${radius}@${lat},${lon}`
		})
		.asPromise()
		.then(function(response){
			const places = [];
			if(response.json.status == "OK"){
				for(const candidate of response.json.candidates){
					places.push(
						{
							place_id: candidate.place_id,
							distance: getDistanceFromLatLonInMeters(lat, lon, candidate.geometry.location.lat, candidate.geometry.location.lng),
							geometry:{
								type: "Point", 
								coordinates: [candidate.geometry.location.lng, candidate.geometry.location.lat]
							},
							name: candidate.name
						}
					);
				}
				
				places.sort(sortByDistance);
			}
			resolve(places);
		})
		.catch(function(err){
			console.error(err);
			resolve([]);
		});
		
	});
};


module.exports = {
	findChannelByDistance,
	findChannelByIP,
	findPlaceNearby
};