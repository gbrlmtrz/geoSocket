# geoSocket

## ToDo
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
- Medium
	- [x] Get state of a channel through redis
- Low
	- [ ] Recieve git pushes, then do a pull, then reload pm2 instance
	- [x] Set an interval to store all states in cloudant every X minutes
