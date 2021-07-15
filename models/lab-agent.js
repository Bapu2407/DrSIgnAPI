//init code
const mongoose = require('mongoose');

//user schema
const labagentSchema = mongoose.Schema({

   
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
   dob:{
    type:String,
    unique: false,
    required:true
   },

   agentPhrmcyId:{
    type:String,
    unique: false,
    required:true
   },
       
   mobileNumber:{
    type:String,
    unique: false,
    required:true
   },
             
   pharmacyLicenceCopy:{
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
 
    username:{
    type:String,
    unique: true,
    required:true
   },
   pharmacyLicenceCopyURL:{
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
var Labagent = mongoose.model('labagent_profile_details',labagentSchema);

module.exports = Labagent
