//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const epresTestSchema = mongoose.Schema({


   eprescriptionId:{
    type:String,
    unique: false,
    required:false
   },
   testName:{
    type:String,
    required:false
   },
   testCategory:{
    type:String,
    required:false
   },
   testMethod:{
      type:String,
      required:false
     },
   frequency:{
    type:String,
    required:false
   },
   result:{
      type:String,
      required:false
     },
   active:{
      type:Boolean,
      default:true
     },
     createDate:{
      type:Date,
      default:Date.now()
     },
     updatedDate:{
      type:Date,
      default:Date.now()
     }
   
});

//doctor model
var EprescriptionTest = mongoose.model('eprescription-tests',epresTestSchema);
module.exports = EprescriptionTest
