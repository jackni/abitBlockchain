const Block = require('../models/Block');
const utils = require('../utils/utils');

const calculateHashForBlock = (block) => {
    return utils.calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};

const getLatestBlock = (blockchain) => { 
    return blockchain.length > 0 ? blockchain[blockchain.length - 1] : undefined;
}

const isValidNewBlock = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof (calculateHashForBlock(newBlock)));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    return true;
};

// const getInitialBlock = (data) => {
//     const timestamp = new Date().getTime() / 1000;
//     const hash = utils.calculateHash(0,"0",timestamp, data);
//     return new Block(0, "0", timestamp, data, hash);
// }

//first block in blockchain
const getGenesisBlock = () => {
    const hash = utils.calculateHash(0,"0",0000000000, "");
    return new Block(0, "0", 0000000000, "", hash);
};

const generateNextBlock = (blockData, previousBlock) => {

    const nextIndex = previousBlock.index + 1;
    
    const nextTimestamp = new Date().getTime() / 1000;
    
    const nextHash = utils.calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);

    return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash);
};

const addBlock = (newBlock, blockchain) => {
    if (isValidNewBlock(newBlock, getLatestBlock(blockchain))) {
        blockchain.push(newBlock);
    }
    return;
    // return blockchain;
};

const getBlockChain = ()=> {
    return blockchain = [];
}

module.exports.addBlock = addBlock;
module.exports.getLatestBlock = getLatestBlock;
module.exports.isValidNewBlock = isValidNewBlock;
module.exports.getGenesisBlock = getGenesisBlock;
module.exports.getBlockChain = getBlockChain;
module.exports.generateNextBlock = generateNextBlock;