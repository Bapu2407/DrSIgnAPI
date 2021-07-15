//init code
const mongoose = require('mongoose');

//user schema
const patientSchema = mongoose.Schema({

   
   emailId:{
    type:String,
    unique: true,
    required:true
   },
   name:{
    type:String,
    unique: false,
    required:true
   },
   dateOfBirth:{
    type:String,
    unique: false,
    required:true
   },
   sex:{
    type:String,
    unique: false,
    required:true
   },
   govtIdType:{
    type:String,
    required:false
   },
   govtIdCode:{
      type:String,
      required:false
     },
   bloodgroupId:{
    type:String,
    required:false
   },
   permanentAddress:{
    type:String,
    required:false
   },
   presentAddress:{
    type:String,
    required:false
   },
   mobileNumber:{
    type:String,
    required:false
   },
   alternateMobileNumber:{
      type:String,
      required:false
     },         
   uploadPhotoDemographic:{
    type:String,
    required:false
   }, 
   
   otp:{
    type:String,
    required:false
   },  
   password:{
    type:String,
    required:false
   }, 
 
   uploadPhotoDemographicURL:{
    type:String,
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

   verified:{
      type:Boolean,
      default:true
     },

   active:{
      type:Boolean,
      default:true
     }
   

});

//patient model
var Patient = mongoose.model('patient_profile_details',patientSchema);

module.exports = Patient
