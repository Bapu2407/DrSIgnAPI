//init code
const mongoose = require('mongoose');

const EprescriptionDoctorDetailsSchema = mongoose.Schema({


   eprescriptionId:{
    type:String,
    unique: false,
    required:false
   },
   doctorId:{
    type:String,
    required:false
   },
   doctorName:{
    type:String,
    required:false
   },
   digitalSigned:{
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
var EprescriptionDoctorDetails = mongoose.model('eprescription-doctor-details',EprescriptionDoctorDetailsSchema);
module.exports = EprescriptionDoctorDetails
