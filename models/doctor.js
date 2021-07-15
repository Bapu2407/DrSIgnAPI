//init code
const mongoose = require('mongoose');

//user schema
const doctorSchema = mongoose.Schema({

   
 emailId:{
    type:String,
    unique: true,
    required:true
   },
   alternateEmailId:{
      type:String,
      unique: false,
      required:false
     },
   fcmId:{
      type:String,
      required:false
     },
  deviceId:{
      type:String,
      required:false
     },
  name:{
    type:String,
    unique: false,
    required:true
   },
   designation:{
    type:String,
    required:true
   },
   registeredAddress:{
    type:String,
    required:false
   },
   dateOfBirth:{
      type:Date,
      required:false
     },
   issueingAuthority:{
      type:String,
      required:false
     },
   issueingDate:{
      type:Date,
      required:false
     },
   validTill:{
      type:Date,
      required:false
     },
  practiceCategory:{
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
    required:true
   },   
   degreeDiploma:{
    type:String,
    required:false
   },   
   generalPractice:{
    type:String,
    required:false
   },   
   professionalPracticeExperience:{
    type:String,
    required:false
   },   
   currentPracticeInformation:{
    type:String,
    required:false
   },   
  
   doctorRegistrationInformation:{
    type:String,
    required:false
   },   
   uploadPhotoProfessional:{
    type:String,
    required:true
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
   uploadPhotoProfessionalURL:{
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
   active:{
      type:Boolean,
      default:true
     }
   

});

//doctor model
var Doctor = mongoose.model('doctor_professional_details',doctorSchema);

module.exports = Doctor