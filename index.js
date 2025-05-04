module.exports = {
	nodes: {
		Signal: require('./dist/nodes/Signal/Signal.node').Signal,
		SignalTrigger: require('./dist/nodes/SignalTrigger/SignalTrigger.node').SignalTrigger,
	},
	credentials: {
		SignalCliApi: require('./dist/credentials/signalCliApi.credentials').SignalCliApi,
	},
};
