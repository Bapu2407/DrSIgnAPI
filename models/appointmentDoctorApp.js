//init code
//const mongoose = require('mongoose');
const doctorMongoose = require('../database');
//user schema
const appointmentDoctorAppSchema = doctorMongoose.Schema({


   appointmentId:{
    type:String,
    unique: false,
    required:false
   },
   requestId:{
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
    required:false
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
var AppointmentDoctorApp = doctorMongoose.model('appointments',appointmentDoctorAppSchema);

module.exports = AppointmentDoctorApp
