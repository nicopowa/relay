const net = require("net");

class TCPServer {
	
	constructor(port, onData, onError, onConnect, onDisconnect) {
		this._port = port;
		
		this._data = onData || die;
		this._error = onError || die;
		this._connect = onConnect || die;
		this._disconnect = onDisconnect || die;

		this.clients = new Map();
		this._server = net.createServer(this.onConnect.bind(this));
		this._server.on("error", this.onError.bind(this));
		this._server.listen(this._port);
		trace("TCP server start", this._port);
	}
	
	onConnect(socket) {
		socket.name = socket.remoteAddress + "." + socket.remotePort;
		trace("new tcp client : " + socket.name);
		socket.on("data", data => this.onData(socket, data));
		socket.on("end", () => this.onDisconnect(socket));
		this.clients.set(socket.name, socket);
		this._connect(socket);
	}
	
	onData(socket, data) {
		trace("tcp data : " + socket.name);
		console.log(data);
		this._data(socket, data);
	}
	
	onDisconnect(socket) {
		trace("tcp disconnected : " + socket.name);
		this.clients.delete(socket.name);
		this._disconnect(socket);
	}
	
	onError(err) {
		error("tcp error : " + err);
		this._error(err);
	}
	
	send(socket, data) {
		socket.write(data.toString());
	}

	all(data) {
		this.clients.forEach(socket => this.send(socket, data));
	}
	
	stop() {
		trace("TCP server stop", this._port);
		this.clients.forEach(socket => socket.destroy());
		this.clients.clear();
		this._server.close();
	}

	get port() {
		return this._port;
	}
	
	/*static localIP() {
		let interfaces = os.networkInterfaces(), 
		values = Object.keys(interfaces).map(name => interfaces[name]);
		values = [].concat.apply([], values).filter(val => val.family === "IPv4" && val.internal === false);
		return values.length ? values[0].address : "0.0.0.0";
	}*/
	
}

module.exports = TCPServer;