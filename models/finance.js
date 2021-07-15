//init code
const mongoose = require('mongoose');
//const patientMongoose = require('../patientdatabase');
//user schema
const financeSchema = mongoose.Schema({


   address:{
    type:String,
    unique: false,
    required:false
   },
   mobileNumber:{
    type:String,
    required:false
   },
   billTo:{
    type:String,
    required:false
   },
   doctorId:{
      type:String,
      required:false
     },
   invoiceAmount:{
      type:String,
      required:false
     },
   status:{
    type:String,
    required:false
   },
   appointmentId:{
      type:String,
      unique: false,
      required:false
   },
   paymentMode:{
      type:String,
    unique: false,
    required:false
   },
   action:{
      type:String,
    unique: false,
    required:false
   },
   invoiceDate:{
      type:Date,
      default:Date.now()
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
var InvoiceFinance = mongoose.model('invoices',financeSchema);
module.exports = InvoiceFinance
