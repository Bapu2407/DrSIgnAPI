//init code
const mongoose = require('mongoose');

const EprescriptionBasicDetailSchema = mongoose.Schema({


   eprescriptionId:{
    type:String,
    unique: false,
    required:false
   },
   symptoms:{
    type:String,
    required:false
   },
   frequency:{
    type:String,
    required:false
   },
   anySpecific:{
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
var EprescriptionBasicDetail = mongoose.model('eprescription-basic-details',EprescriptionBasicDetailSchema);
module.exports = EprescriptionBasicDetail
