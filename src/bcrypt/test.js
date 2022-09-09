const bcrypt = require("bcrypt");

const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";

const hash = async(data) => {

    let hash = "";
    hash = await bcrypt.hash(data, 10);
    console.log("data", data);
    console.log("hash", hash);

    return hash;
};
const compare = async(password, hashed) => {
    const match = await bcrypt.compare(password, hashed);
    return match
};

module.exports = { hash, compare };