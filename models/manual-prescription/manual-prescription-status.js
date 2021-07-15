//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const manualpresStatusSchema = mongoose.Schema({


   manualprescriptionId:{
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
var ManualprescriptionStatus = mongoose.model('manual-prescription-statuses',manualpresStatusSchema);
module.exports = ManualprescriptionStatus
