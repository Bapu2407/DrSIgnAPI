//init code
const mongoose = require('mongoose');

const epresOpenSchema = mongoose.Schema({


   patientId:{
    type:String,
    unique: false,
    required:false
   },
   name:{
    type:String,
    required:false
   },
   sex:{
    type:String,
    required:false
   },
   locationId:{
      type:String,
      required:false
     },
     appointmentId:{
      type:String,
      required:false
     },
   profession:{
      type:String,
      required:false
     },
   age:{
    type:String,
    required:false
   },
   bloodPressure:{
      type:String,
      unique: false,
      required:false
   },
   height:{
      type:String,
    unique: false,
    required:false
   },
   weight:{
      type:String,
    unique: false,
    required:false
   },
   pdfURL:{
      type:String,
    unique: false,
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
var EprescriptionOpen = mongoose.model('eprescription-opens',epresOpenSchema);
module.exports = EprescriptionOpen
