'use strict';
var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");

const Block = require('./models/block');
const MessageType = require('./models/messageType');
const chainService = require('./services/chainService');

const http_port = process.env.HTTP_PORT || 3001;
const p2p_port = process.env.P2P_PORT || 6001;
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const sockets = [];

let inMemoBlockchain = [];

var initHttpServer = () => {
    var app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req, res) => res.send(JSON.stringify(inMemoBlockchain)));
    
    // app.post('/initBlock',(req,res)=> {
    //     const initBlock = chainService.getInitialBlock(req.body.data);
    //     inMemoBlockchain.push(initBlock);
    //     const msg = responseLatestMsg();
    //     console.log(msg);
    //     broadcast(msg);
    //     res.send();
    // });

    app.post('/mineBlock', (req, res) => {
        if(inMemoBlockchain.length < 1) {
            const initBlock = chainService.getInitialBlock(req.body.data);
            inMemoBlockchain.push(initBlock);
            const msg = responseLatestMsg();
            console.log(msg);
            broadcast(msg);
            res.send();
            return;
        }

        const lastBlock = chainService.getLatestBlock(inMemoBlockchain);
        
        const newBlock = chainService.generateNextBlock(req.body.data, lastBlock);
        inMemoBlockchain = chainService.addBlock(newBlock, inMemoBlockchain);
        
        const msg = responseLatestMsg();
        console.log(msg);
        broadcast(msg);
        console.log('block added: ' + JSON.stringify(newBlock));
        res.send();
    });
    
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });

    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};


var initP2PServer = () => {
    var server = new WebSocket.Server({port: p2p_port});
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);

};

var initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                const msg = responseLatestMsg();
                console.log(msg);
                write(ws, msg);
                break;
            case MessageType.QUERY_ALL:
                const allchainMsg = responseChainMsg();
                console.log(allchainMsg);
                write(ws, allchainMsg);
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};

var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

const connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        const ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
};

const handleBlockchainResponse = (message) => {
    const receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
    
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    
    const latestBlockHeld = chainService.getLatestBlock(inMemoBlockchain);
    console.log("*****************");
    console.log(latestBlockHeld);
    console.log("*****************");
    if (latestBlockReceived && latestBlockHeld && (latestBlockReceived.index > latestBlockHeld.index)) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log("We can append the received block to our chain");
            
            inMemoBlockchain.push(latestBlockReceived);
            
            broadcast(responseLatestMsg());
        } else if (receivedBlocks.length === 1) {
            console.log("We have to query the chain from our peer");
            broadcast(queryAllMsg());
        } else {
            console.log("Received blockchain is longer than current blockchain");
            replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};

const replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');

        blockchain = newBlocks;
        
        broadcast(responseLatestMsg());
    } else {
        console.log('Received blockchain invalid');
    }
};

const isValidChain = (blockchainToValidate) => {
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
        return false;
    }
    const tempBlocks = [blockchainToValidate[0]];
    for (var i = 1; i < blockchainToValidate.length; i++) {
        if (chainService.isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
            tempBlocks.push(blockchainToValidate[i]);
        } else {
            return false;
        }
    }
    return true;
};

const queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
const queryAllMsg = () => ({'type': MessageType.QUERY_ALL});

const responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(inMemoBlockchain)
});

const responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([chainService.getLatestBlock(inMemoBlockchain)])
});

const write = (ws, message) => ws.send(JSON.stringify(message));
const broadcast = (message) => sockets.forEach(socket => write(socket, message));

connectToPeers(initialPeers);
initHttpServer();
initP2PServer();