//a is start
//r is the multiplication factor
//n is the term number
function geometricSeriesSum(a, r, n) {
    return a * ((1 - Math.pow(r, n)) / (1 - r));
}

module.exports.geometricSeriesSum = geometricSeriesSum ;
