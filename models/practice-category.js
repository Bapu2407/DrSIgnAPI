//init code
const mongoose = require('mongoose');

//user schema
const practiceCategorySchema = mongoose.Schema({

   
   category:{
    type:String,
    unique: true,
    required:true
   },   createdDate:{
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
var PracticeCategory = mongoose.model('practice_categories',practiceCategorySchema);

module.exports = PracticeCategory
