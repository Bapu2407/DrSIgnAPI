//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const previouspresUploadSchema = mongoose.Schema({


   patientId:{
    type:String,
    required:true
   },
   uploadPhotoPreviousPrescription:{
    type:String,
    required:true
   }, 
  uploadPhotoPreviousPrescriptionURL:{
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
var Previousprescriptionupload = mongoose.model('previous-prescription-upload',previouspresUploadSchema);
module.exports = Previousprescriptionupload
