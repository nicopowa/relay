const io = outload("socket.io");

class IOServer {

	constructor(port, onData, onError, onConnect, onDisconnect) {
		this._port = port;
		
		this._data = onData || die;
		this._error = onError || die;
		this._connect = onConnect || die;
		this._disconnect = onDisconnect || die;

		this.clients = new Map();
		this._server = io(port, {});
		this._server.on("connection", this.onConnect.bind(this));
		this._server.on("error", this.onError.bind(this));
		this._server.attach(3000, {
			pingInterval: 10000,
			pingTimeout: 5000,
			cookie: false
		});
		trace("IO server start", this._port);
	}

	onData(socket, data) {
		trace("io data : " + socket.name + " > " + data);
		this._data(socket, data);
	}

	onError(err) {
		error("io error : " + err);
		this._error(err);
	}

	onConnect(socket) {
		socket.name = socket.request.socket._peername.address + "." + socket.request.socket._peername.port;
		trace("new io client : " + socket.name);
		socket.use(packet => this.onData(socket, packet));
		socket.on("disconnect", () => this.onDisconnect(socket));
		this.clients.set(socket.name, socket);
		this._connect(socket);
	}

	onDisconnect(socket) {
		trace("io disconnected : " + socket.name);
		this.clients.delete(socket.name);
		this._disconnect(socket);
	}

	send(socket, ...args) {
		socket.emit(...args);
	}

	all(...args) {
		args = args.map(arg => arg.toString("utf8"))
		if(args.length == 1) args.unshift("msg");
		this._server.sockets.emit(...args);
		//this.clients.forEach(socket => this.send(socket, ...args));
	}
	
	stop() {
		trace("IO server stop", this._port);
		this._server.close();
		this.clients.forEach(socket => socket.destroy()); // disconnect() ?
		this.clients.clear();
	}

	get port() {
		return this._port;
	}

}

module.exports = IOServer;