//init code
const mongoose = require('mongoose');
const assert = require('assert');
const db_url = process.env.DB_URL;
var dlog = require('debug')('dlog')
//conection code
console.log(db_url);
mongoose.connect(
    'mongodb://localhost:27017/doctorSignetDb',
    {
        useNewUrlParser :true,
        useUnifiedTopology :true,
        useCreateIndex :true
    },
    function(error,link){
        //check error
        assert.equal(error, null,'DB connect fail..');
        dlog('DB connect success...');
        //console.log(link);
    }
);

module.exports = exports = mongoose;