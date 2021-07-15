//init code
const mongoose = require('mongoose');

//user schema
const serviceOperationTimeSchema = mongoose.Schema({

   
   serviceID:{
    type:String,
    unique: false,
    required:true
   },
   date:{
    type:String,
    required:false
   },

   startingTime:{
    type:String,
    required:true
   },
   endingTime:{
    type:String,
    required:true
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
var ServiceOperationTime = mongoose.model('service_operation_time',serviceOperationTimeSchema);

module.exports = ServiceOperationTime
