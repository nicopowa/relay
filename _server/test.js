const IOClient = require("./io/client");
const TCPClient = require("./tcp/client");
const UDPClient = require("./udp/client");
const WSClient = require("./ws/client");

class RelayTest {

	constructor(relay) {
		this.relay = relay;

		this._test();
	}

	_wait(ms = 500) {
		console.log("");
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async _test() {

		console.log("test relay");

		await this._wait();

		let tcp = this.relay._start("tcp", 55555);
		console.log(tcp);

		await this._wait();

		let io = this.relay._start("io", 55556);
		console.log(io);

		await this._wait();

		let udp = this.relay._start("udp", 55557);
		console.log(udp);

		await this._wait();

		let ws = this.relay._start("ws", 55558);
		console.log(ws);

		await this._wait();

		let tcptoio = this.relay._pipe(tcp.uid, io.uid);
		console.log("pipe", tcptoio);

		let iototcp = this.relay._pipe(io.uid, tcp.uid);
		console.log("pipe", iototcp);

		let udptotcp = this.relay._pipe(udp.uid, tcp.uid);
		console.log("pipe", udptotcp);

		let tcptoudp = this.relay._pipe(tcp.uid, udp.uid);
		console.log("pipe", tcptoudp);

		let tcptows = this.relay._pipe(tcp.uid, ws.uid);
		console.log("pipe", tcptows);
		
		let wstotcp = this.relay._pipe(ws.uid, tcp.uid);
		console.log("pipe", wstotcp);

		await this._wait();

		console.log("check", this.relay._port(55556));

		await this._wait();

		let tcpclient = new TCPClient("localhost", 55555,
			() => console.log("tcp client connect"),
			data => console.log("tcp client data :", data),
			() => console.log("tcp client disconnect"),
			err => console.log("tcp client error :", err)
		);

		await this._wait();

		let ioclient = new IOClient("http://localhost", 55556,
			() => console.log("io client connect"),
			data => console.log("io client data :", data),
			() => console.log("io client disconnect"),
			err => console.log("io client error :", err)
		);

		await this._wait();

		let udpclient = new UDPClient("localhost", 55557,
			data => console.log("udp client data :", data),
			err => console.log("udp client error :", err)
		);

		await this._wait();

		let wsclient = new WSClient("ws://localhost", 55558,
			() => console.log("ws client connect"),
			data => console.log("ws client data :", data),
			() => console.log("ws client disconnect"),
			err => console.log("ws client error :", err)
		);

		await this._wait();

		ioclient.send("haha", "hoho");

		await this._wait();

		tcpclient.send("hahaha");

		await this._wait();

		udpclient.send("hahaha");

		await this._wait();

		wsclient.send("hahaha");

	}

}

module.exports = RelayTest;