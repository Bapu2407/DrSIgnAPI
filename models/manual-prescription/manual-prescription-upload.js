//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const manualpresUploadSchema = mongoose.Schema({


   patientId:{
    type:String,
    required:true
   },
   uploadPhotoManualPrescription:{
    type:String,
    required:true
   }, 
  uploadPhotoManualPrescriptionURL:{
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
   validated:{
      type:Boolean,
      default:false
     },
   active:{
      type:Boolean,
      default:true
     }
   
});

//patient model
var Manualprescriptionupload = mongoose.model('manual-prescription',manualpresUploadSchema);
module.exports = Manualprescriptionupload
