//init code
const mongoose = require('mongoose');

const epresPreviousMedicalHistorySchema = mongoose.Schema({

   eprescriptionId:{
    type:String,
    unique: false,
    required:false
   },
   diseaseName:{
    type:String,
    required:false
   },
   previousMedication:{
    type:String,
    required:false
   },
   lastTestResults:{
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
var EprescriptionPreviousMedicalHistory = mongoose.model('eprescription-previous-medical-histories',epresPreviousMedicalHistorySchema);
module.exports = EprescriptionPreviousMedicalHistory
