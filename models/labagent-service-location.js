//init code
const mongoose = require('mongoose');

//user schema
const labagentServiceLocationSchema = mongoose.Schema({

   
   labagentID:{
    type:String,
    required:true
   },
   serviceID:{
    type:String,
    required:true,
    unique:true
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
var LabagentServiceLocation = mongoose.model('labagent_service_location_details',labagentServiceLocationSchema);

module.exports = LabagentServiceLocation
