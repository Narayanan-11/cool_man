const crypto = require("crypto");

const generateSKU = (category)=>{

const prefix = category
.substring(0,3)
.toUpperCase();

const random = crypto
.randomBytes(3)
.toString("hex")
.toUpperCase();

return `${prefix}-${random}`;

};

module.exports = generateSKU;