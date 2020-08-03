const net = require("net");

class TCPServer {
	
	constructor(port, onData = die, onError = die, onConnect = die, onDisconnect = die) {

		this._port = port;
		
		this._data = onData;
		this._error = onError;
		this._connect = onConnect;
		this._disconnect = onDisconnect;

		this._clients = new Map();
		this._server = net.createServer(this.onConnect.bind(this));
		this._server.on("error", this.onError.bind(this));
		this._server.listen(this._port);
		
		console.log("tcp server start", this._port);
	}
	
	onConnect(socket) {
		socket.name = socket.remoteAddress + ":" + socket.remotePort;
		console.log("new tcp client :", socket.name);
		socket.on("data", data => this.onData(socket, data));
		socket.on("end", () => this.onDisconnect(socket));
		this._clients.set(socket.name, socket);
		this._connect(socket);
	}
	
	onData(socket, data) {
		console.log("tcp data :", socket.name, data);
		this._data(socket, data);
	}
	
	onDisconnect(socket) {
		console.log("tcp disconnected :", socket.name);
		this._clients.delete(socket.name);
		this._disconnect(socket);
	}
	
	onError(err) {
		error("tcp error :", err);
		this._error(err);
	}
	
	send(socket, data) {
		socket.write(data.toString());
	}

	all(data) {
		console.log("tcp send all :", data);
		this._clients.forEach(socket => this.send(socket, data));
	}
	
	stop() {
		console.log("TCP server stop :", this._port);
		this._clients.forEach(socket => socket.destroy());
		this._clients.clear();
		this._server.close();
	}

	get port() {
		return this._port;
	}

	get clients() {
		return this._clients;
	}
	
	/*static localIP() {
		let interfaces = os.networkInterfaces(), 
		values = Object.keys(interfaces).map(name => interfaces[name]);
		values = [].concat.apply([], values).filter(val => val.family === "IPv4" && val.internal === false);
		return values.length ? values[0].address : "0.0.0.0";
	}*/
	
}

module.exports = TCPServer;