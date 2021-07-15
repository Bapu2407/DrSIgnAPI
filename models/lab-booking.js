//init code
const mongoose = require('mongoose');

//user schema
const labbookSchema = mongoose.Schema({

  labbookingId:{
    type:String,
    unique: false,
    required:false
   },
   requestId:{
    type:String,
    required:false
   },

    patientId:{
      type:String,
      required:false
    },
    pescriptionId:{
      type:String,
      required:false
    },
   locationId:{
      type:String,
      required:false
    },     
    labbookingDate:{
      type:String,
      required:false
    },
    labbookingTime:{
      type:String,
      required:false
    },
    labbookingStatus:{
      type:String,
      unique: false,
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
      default:false
     }
   

});


var Labbook = mongoose.model('lab_book_details',labbookSchema);

module.exports = Labbook
