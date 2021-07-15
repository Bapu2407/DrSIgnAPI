//init code
const mongoose = require('mongoose');

const epresMedicationSchema = mongoose.Schema({

   eprescriptionId:{
    type:String,
    unique: false,
    required:false
   },
   medicationName:{
    type:String,
    required:false
   },
   composition:{
    type:String,
    required:false
   },
   medicationCategory:{
    type:String,
    required:false
   },
   frequency:{
    type:String,
    required:false
   },
   beforeAfterFood:{
    type:String,
    required:false
   },
   
   dosesFrequency:{
      type:String,
      required:false
     },
   anySpecial:{
    type:String,
    required:false
   },
   remarks:{
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
var EprescriptionMedication = mongoose.model('eprescription-medications',epresMedicationSchema);
module.exports = EprescriptionMedication
