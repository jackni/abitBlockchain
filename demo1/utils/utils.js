const CryptoJS = require("crypto-js");

const calculateHash = (index, previousHash, timestamp, data) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

module.exports.calculateHash = calculateHash;