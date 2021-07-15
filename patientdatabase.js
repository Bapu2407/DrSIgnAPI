//init code
const patientMongoose = require('mongoose');
const assert = require('assert');
const patientDbUrl = process.env.PATIENT_DB_URL;
var dlog = require('debug')('dlog')
//conection code
patientMongoose.connect(
    patientDbUrl,
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

module.exports =  exports = patientMongoose;