//init code
const mongoose = require('mongoose');

//user schema
const attendantSchema = mongoose.Schema({

   
   doctorID:{
    type:String,
    unique: false,
    required:true
   },
   email:{
    type:String,
    unique: true,
    required:true
   },
   name:{
    type:String,
    unique: false,
    required:true
   },
   mobile:{
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
var Attentdant = mongoose.model('attendants',attendantSchema);

module.exports = Attentdant
