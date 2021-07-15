//init code
const mongoose = require('mongoose');

//user schema
const serviceLocationSchema = mongoose.Schema({

   
   labID:{
    type:String,
    unique: false,
    required:true
   },
   areaname:{
    type:String,
    required:false
   },
   pincode:{
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
var ServiceLocation = mongoose.model('service_locations',serviceLocationSchema);

module.exports = ServiceLocation
