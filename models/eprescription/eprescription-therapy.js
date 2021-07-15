//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const epresTherapySchema = mongoose.Schema({


   eprescriptionId:{
    type:String,
    unique: false,
    required:false
   },
   therapyName:{
    type:String,
    required:false
   },
   frequency:{
    type:String,
    required:false
   },
   subCategoryTherapy:{
    type:String,
    required:false
   },
   remarks:{
      type:String,
      required:false
   },   
   continuityFrequency:{
    type:String,
    required:false
   },   
   specialCase:{
    type:Boolean,
    default:true
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
var EprescriptionTherapy = mongoose.model('eprescription-therapies',epresTherapySchema);
module.exports = EprescriptionTherapy
