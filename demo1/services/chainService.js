const Block = require('../models/Block');
const utils = require('../utils/utils');

const difficulty = 3; //000

const calculateHashForBlock = (block) => {
    return utils.calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};

const getLatestBlock = (blockchain) => { 
    return blockchain.length > 0 ? blockchain[blockchain.length - 1] : undefined;
}

//using standard block chain difficulty as using prefix number of "0"
const mineBlock = (difficulty, block) => {
    // console.log(block);
    while (block.hash.substring(0, difficulty) !== new Array(difficulty + 1).join("0")) {
        block.hash = utils.calculateHash(block.index, block.previousHash, block.timestamp, JSON.stringify(block.data));
        console.log(`-------------CALCUATING: ${block.hash} with Difficulty: ${difficulty}------------------`);
        block.timestamp = new Date().getTime() / 1000;
    }
    console.log(`BLOCK MINED: ${block.hash} with Difficulty: ${difficulty}`);
}

const isValidNewBlock = (newBlock, previousBlock) => {
    //index check
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    }
    //hash validation ,merlke tree
    else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } 
    //hash validation on the newblock
    else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        // console.log(typeof (newBlock.hash) + ' ' + typeof (calculateHashForBlock(newBlock)));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    return true;
};

const getGenesisBlock = () => {
    // const hash = utils.calculateHash(0,"0",0000000000, "");
    return new Block(0, "0", 0000000000, "");
};

const generateNextBlock = (blockData, previousBlock) => {

    const nextIndex = previousBlock.index + 1;
    const newBlock = new Block(nextIndex, previousBlock.hash, blockData);
    mineBlock(difficulty, newBlock);
    console.log(`******** New BLOCK generated: ${JSON.stringify(newBlock)} **************`);
    return newBlock;
};

const addBlock = (newBlock, blockchain) => {
    if (isValidNewBlock(newBlock, getLatestBlock(blockchain))) {
        blockchain.push(newBlock);
        console.log(`******** New BLOCK added: ${JSON.stringify(newBlock)} **************`);
    }
    return;
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