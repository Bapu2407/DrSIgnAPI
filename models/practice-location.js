//init code
const mongoose = require('mongoose');

//user schema
const practiceLocationSchema = mongoose.Schema({

   
   doctorID:{
    type:String,
    unique: false,
    required:true
   },
   addByID:{
    type:String,
    unique: false,
    required:true
   },
   deletedByID:{
      type:String,
      unique: false,
      required:false
     },
   name:{
    type:String,
    required:true
   },
   slot:{
      type:Number,
      required:true
     },
   area:{
    type:String,
    required:false
   },
   address:{
    type:String,
    required:false
   },
   city:{
      type:String,
      required:false
     },
     state:{
      type:String,
      required:false
     },
     attendantID:{
      type:String,
      unique: false,
      required:false
     },
     dateTime:[],
   nearByLocation:{
    type:String,
    required:false
   },
   latitude:{
    type:Number,
    required:false
   },   
   longitude:{
    type:Number,
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
var PracticeLocation = mongoose.model('practice_locations',practiceLocationSchema);

module.exports = PracticeLocation
