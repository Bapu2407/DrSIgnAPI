//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const previouspresStatusSchema = mongoose.Schema({


   previousprescriptionId:{
    type:String,
    unique: false,
    required:false
   },
   status:{
    type:String,
    required:false
   },
   createDate:{
    type:Date,
    default:Date.now()
   },
   updatedDate:{
    type:Date,
    default:Date.now()
   },
   active:{
      type:Boolean,
      default:true
     }
   
});

//patient model
var PreviousprescriptionStatus = mongoose.model('previous-prescription-statuses',previouspresStatusSchema);
module.exports = PreviousprescriptionStatus
