function Util() {

}

Util.prototype.createRandom = (minNum,maxNum) => {
    return Math.floor(Math.random() * (maxNum - minNum) + minNum);
}
Util.prototype.capitalize = ([first,...rest],lowerRest = false) => {
    return first.toUpperCase() + (lowerRest ? rest.join("").toLowerCase() : rest.join(''));
}

module.exports = new Util();