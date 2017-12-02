const CryptoJS = require("crypto-js");

const calculateHash = (index, previousHash, timestamp, data) => {
    // const timestamp = new Date().getTime() / 1000;
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

const calculateHashWithNonce = (index, previousHash, data, timestamp, nonce) => {
    // const timestamp = new Date().getTime() / 1000;
    return CryptoJS.SHA256(index + previousHash + timestamp + data + nonce).toString();
}

module.exports.calculateHash = calculateHash;
module.exports.calculateHashWithNonce = calculateHashWithNonce;