
const {check, validationResult} = require('express-validator');
const InvoiceFinance = require('../../models/finance');
const SettingFinance = require('../../models/setting');
mongoDBInstance  = require('mongodb');
const Str = require('@supercharge/strings')
var mongoDB = require('../../databaseconstant');
var MongoClient = require('mongodb').MongoClient;
const common = require('../../utility/common');
var dlog = require('debug')('dlog')

var fs = require('fs');
var request = require('request');

var doctorAppDoctorFetchApiEndPoint =  "http://"+process.env.DOCTORAPPIPADDRESS+":"+process.env.DOCTORAPPPORT+"/api/send-message-to-doctor"

function sendMsgToDoctor(doctorId,invoiceId){
 

    let jsonBody = {
      "doctorId":doctorId,
      "message":"New invoice has been created",
      "type":"invoice",
      "id":invoiceId
      }
  
      //dlog("jsonBody ="+JSON.stringify(jsonBody))
      request({
        url: doctorAppDoctorFetchApiEndPoint,
        method: 'POST',      
        headers: {
          'content-Type' :"application/json",    
          'accept':"application/json"
        },
        body: JSON.stringify(jsonBody)}
      , function(error, response, body) {
        if (error) { 
          console.log("push message can't be sent for new appointment request due to the following error "+error)
          return 
        }                               
      });    

  
}

//const fsp = require("fs/promises");
module.exports = function (app) {

  app.post('/api/invoice-create', [
    
    check('doctorId').not().isEmpty().trim().escape(),
    check('address').not().isEmpty().trim().escape(),
    check('billTo').not().isEmpty().trim(),
    check('paymentMode').not().isEmpty().trim(),
    check('appointmentId').not().isEmpty().trim(),
    check('mobileNumber').not().isEmpty().trim(),
  
 ],function (req, res) {        
       dlog(" inside invoice-create api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
       
       let filter = { doctorId:  req.body.doctorId};
       
       SettingFinance.findOne(filter, function (err, setting) {
       
          var invoiceAmount = 0.0
          if (err || !setting) {
            dlog(" No setting record found in DB")
            return common.handleError(err,'No setting record found for this doctor, which can provide doctor service fees, GST and Dr Signet Commision for this doctor, please insert them first before creating invoice with this Doctor ...',res,500)    
            invoiceAmount = 0.0
          }
          dlog("setting  ==>" +JSON.stringify(setting))
          dlog("setting.gst ==>" +setting.gst)
          dlog("setting.doctorServiceFees ==>" +setting.serviceFees)
          dlog("setting.drSignetCommision ==>" +setting.drSignetCommmision)

          invoiceAmount = calcInvoice(setting.gst,setting.serviceFees,setting.drSignetCommmision)
          
          inputCollection.invoiceAmount = invoiceAmount
          var temp = new InvoiceFinance(inputCollection)
        
        // insert data into database
          temp.save(function (error, invoice) {
            // check error
            if (error) {
              return common.handleError(error,'DB Insert Fail...',res,500)           
            }

            dlog("invoice._id ==>" +invoice._id)
            
            sendMsgToDoctor(req.body.doctorId,invoice._id)
            

            // Everything OK
            return res.json({
              status: true,
              message: 'Invoice creation Success...',
              data: invoice
            });
          });
      });
   
   });



app.post('/api/invoice-update', [
  check('invoiceId').not().isEmpty().trim().escape(),
  check('address').not().isEmpty().trim().escape(),
  check('billTo').not().isEmpty().trim(),
  check('status').not().isEmpty().trim(),
  check('paymentMode').not().isEmpty().trim(),
  check('appointmentId').not().isEmpty().trim(),
  check('mobileNumber').not().isEmpty().trim()
],function (req, res) {        
     dlog(" inside invoice-update api  ")

     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return common.handleError(errors.array(),'Validation error.',res,999)
     }

     dlog("name ="+req.body.name)
     //var inputCollection = req.body    

     InvoiceFinance.findById(req.body.invoiceId, function (err, invoice) {
      if (err || !invoice) return  common.handleError(err, 'No invoice record found with the invoice ID',res,500)   
    
      if(req.body.address)
        invoice.address = req.body.address
      if(req.body.billTo)
        invoice.billTo = req.body.billTo
      if(req.body.status)
        invoice.status = req.body.status

        if(req.body.status && req.body.status.trim().toUpperCase() == "PAID"){
          sendMsgToDoctor(invoice.doctorId,invoice._id)
        }

        if(req.body.invoiceDate && req.body.status.trim() != ""){        
        invoice.invoiceDate = common.convertStringTodate(req.body.invoiceDate)
        }
        if(req.body.invoiceAmount && req.body.invoiceAmount.trim() != ""){          
          invoice.invoiceAmount = req.body.invoiceAmount
        }
        if(req.body.paymentMode)
          invoice.paymentMode = req.body.paymentMode
     
        if(req.body.mobileNumber)
          invoice.mobileNumber = req.body.mobileNumber
      
        if(req.body.doctorServiceName)
          invoice.doctorServiceName = req.body.doctorServiceName
        if(req.body.drSignetCommmision)
          invoice.drSignetCommmision = req.body.drSignetCommmision
        if(req.body.serviceFees)
          invoice.serviceFees = req.body.serviceFees
      if(req.body.appointmentId)
        invoice.appointmentId = req.body.appointmentId

        
      
      var temp = new InvoiceFinance(invoice)
      temp.save(function (err) {
        if (err) return common.handleError(err, 'invoice-update failed',res,500)   
      
        

        return res.json({
          status: true,
          message: 'invoice-update Success...',
          data: invoice
        });
       // res.send(doctor);
      });
    });
  
  });

}

const calcInvoice = (gst,doctorFees,drSignetCommision) =>{ 
  
  
  let doctorFeesf = parseFloat(doctorFees) 
  dlog("doctorFeesf  ^^^^^^^^^^ == "+doctorFeesf)
  let commision = (parseFloat(drSignetCommision)/100)*doctorFeesf
  dlog("commision  ^^^^^^^^^^ == "+commision)
  let total = commision +  doctorFeesf
  dlog("total ^^^^^^^^^^ == "+total)
  let gst2 = parseFloat(gst); 
  gst2 = (gst/100)*total; 

  dlog("GST  ^^^^^^^^^^ == "+gst2)

  let grandTotal = gst2 + total; 
  dlog("grandTotal == "+grandTotal)
  grandTotal = grandTotal.toFixed(2)
  dlog("grandTotal after rounding == "+grandTotal)
  return grandTotal
  }
  