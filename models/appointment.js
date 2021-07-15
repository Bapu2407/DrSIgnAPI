//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const appointmentRemoteSchema = mongoose.Schema({

   appointmentId:{
    type:String,
    unique: false,
    required:false
   },
   requestId:{
    type:String,
    required:false
   },   
   patientId:{
      type:String,
      required:false
     },
   locationId:{
    type:String,
    required:false
   },
   appointmentDate:{
    type:String,
    required:false
   },
   appointmentTime:{
      type:String,
      required:false
     },
   status:{
      type:String,
    unique: false,
    default:"Requested"
   },
   createdDate:{
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
var Appointment = mongoose.model('appointments',appointmentRemoteSchema);

module.exports = Appointment
