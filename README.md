# Relay

NodeJS relay for HTTP / TCP/ UDP / WS / IO


## What it does

Start servers and create pipes between them.
All received data will be relayed through pipes to all clients.

## Set-up

- download this repository : https://github.com/nicopowa/hello-node
- download Relay and copy files to /hello-node/apps/relay
- edit hello-node index.js file : `const appName = "relay";`
- run hello-node server

## How-to
Methods are exposed as HTTP routes
- check/{port} : check port is available
port : port to check

- start/{constructor}/{port} : start server on specified port
constructor : "tcp", "udp", "ws", "io"
port : server port

- stop/{uid} : stop server
uid : server uid

- pipe/{from}/{to} : pipe data from one server to another
from : origin server uid
to : target server uid

- unpipe/{from}/{to} : unpipe data
from : origin server uid
to : target server uid

- send/{uid}/{data} : send data to server from http request
uid : server uid
data : some data


