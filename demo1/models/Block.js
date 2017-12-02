// const utils = require('../utils/utils');
// const _n = require('nonce')();
class Block {
    constructor(index, previousHash, timestamp, data) {
        this.index = index;
        this.previousHash = previousHash? previousHash.toString(): '';
        this.timestamp = timestamp;
        this.data = data;
        this.hash = "";
        // this.nonce = 0;
        // this.hash = utils.calculateHash(this.index, this.previousHash, this.timestamp, JSON.stringify(this.data));
    }
}

module.exports = Block;  