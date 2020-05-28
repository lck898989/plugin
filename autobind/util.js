function Util() {

}

Util.prototype.createRandom = (minNum,maxNum) => {
    return Math.floor(Math.random() * (maxNum - minNum) + minNum);
}

module.exports = Util;