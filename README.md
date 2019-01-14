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
	- [x] Allow server to force just one connection per browser/device/clientid
- Low
	- [ ] Recieve git pushes, then do a pull, then reload pm2 instance
	- [x] Set an interval to store all states in cloudant every X seconds

	
## ToDo pwa
- Very High
	- [ ] PWA
	- [ ] Generate ID for the browser 
		- [ ] For the device?
	- Optional
		- [ ] Run it in a WebWorker?
	- [ ] Get browser fingerprint
- High
	- [ ] Mobile Friendly
	- [ ] Emoji keyboard support
- Medium
	- [ ] Socket connection in the WebWorker
- Low
	- [ ] Facebook login, just retrieve photo and name