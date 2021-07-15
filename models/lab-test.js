//init code
const mongoose = require('mongoose');

//user schema
const labtestSchema = mongoose.Schema({

   
   name:{
    type:String,
    required:true
   },
   category:{
    type:String,
    required:true
   },

    process:{
    type:String,
    required:true
   },

    duration:{
    type:String,
    required:true
   },

    cost:{
    type:String,
    required:true
   },
    sampleColMod:{
    type:String,
    required:true
   },
                
    sampleColProcedure:{
    type:String,
    default:null
   },
   
    beforeFood:{
    type:String,
    default:null
   },
   
    emptyStom:{
    type:String,
    default:null
   }, 
                
      
   createdDate:{
    type:Date,
    default:Date.now()
   },
   updatedDate:{
    type:Date,
    default:Date.now()
   },

   verified:{
      type:Boolean,
      default:true
     },

   active:{
      type:Boolean,
      default:true
     }
   

});

//patient model
var Labtest = mongoose.model('lab_test_details',labtestSchema);

module.exports = Labtest
