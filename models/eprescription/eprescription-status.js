//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const epresStatusSchema = mongoose.Schema({


   eprescriptionId:{
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

//doctor model
var EprescriptionStatus = mongoose.model('eprescription-statuses',epresStatusSchema);
module.exports = EprescriptionStatus
