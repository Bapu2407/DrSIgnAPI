//init code
const mongoose = require('mongoose');

const settingSchema = mongoose.Schema({


   serviceFees:{
    type:String,
    unique: false,
    required:false
   },
   doctorId:{
      type:String,      
      required:true
   },
   doctorServiceName:{
      type:String,
      unique: false,
      required:false
     },
   gst:{
    type:String,
    required:false
   },
   drSignetCommmision:{
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
var SettingFinance = mongoose.model('settings',settingSchema);

module.exports = SettingFinance
