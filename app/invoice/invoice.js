
const {check, validationResult} = require('express-validator');


mongoDBInstance  = require('mongodb');
var mongoDB = require('../../databaseconstant');
var MongoClient = require('mongodb').MongoClient;
const common = require('../../utility/common');
var dlog = require('debug')('dlog')

var ObjectId = require('mongodb').ObjectID


function fetchInvoiceList(appointmentsArry,res,db){
  var invoiceList = []  
          let arrayLen = appointmentsArry.length
          dlog("arrayLen ="+arrayLen)
          
          appointmentsArry.forEach(function(listItem, index){

            var appointmentId1  = listItem.appointmentId
              var  filterInner =  {
                appointmentId: appointmentId1?appointmentId1.toString():''
                }
              dlog("appointmentId ="+listItem.appointmentId)
                  db.collection('invoices').findOne(filterInner)
                  .then(function(invoice){                    
                      return invoice                      
                    }).then(function(invoice){

                      if(invoice){
                        invoiceList.push(invoice)  
                      }

                      if(index == arrayLen -1){
                        console.log("invoiceList =="+JSON.stringify(invoiceList))
                        return res.json({
                          status: true,
                          message: 'Invoice array retrieval success...',
                          //data: doctorIdList
                          data : invoiceList
                          });
                      }
                    })
        })
    
}


function fetchInvoiceListPromises(appointmentsArry,res,db,extra){
          var invoiceList = []  
          let arrayLen = appointmentsArry.length
          dlog("arrayLen ="+arrayLen)
          var promises = []                
          appointmentsArry.forEach(function(listItem, index){            
            var appointmentId1  = listItem.appointmentId
            dlog("appointmentId1 ="+appointmentId1)
            promises.push(new Promise(resolve => {                         
            var  filterInner =  {
              appointmentId: appointmentId1?appointmentId1.toString():''
              }

              if(extra){
                var regex = new RegExp(["^", extra, "$"].join(""), "i");
                filterInner.status = regex
              }
              db.collection('invoices').findOne(filterInner)
              .then(function(invoice){                       
                    return invoice                                   
                }).then(function(invoice){                
                    resolve(invoice);     
                })
            }))
          })
            Promise.all(promises).then(function(values) {
            //  invoiceList.push(values)         
              //console.log("invoiceList =="+JSON.stringify(invoiceList))
              var filtered = values.filter(value => {if(value!= null) return value})
              //console.log("values =="+JSON.stringify(values))

              return res.json({
                status: true,
                message: 'Invoice array retrieval success...',
                //data: doctorIdList
                data : filtered
                });
                

            });
                        
            
       
    
}
module.exports = function (app) {

  app.post('/api/view-invoice-byappointnment', [    
    check('appointmentId').not().isEmpty().trim().escape()
  ],function (req, res) {        
     
    dlog(" inside view-invoices api  ")
 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
      
     dlog("month ="+req.body.month)

     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
        dlog(" Database connected successfully at view-invoices")
      
        let  filter = { appointmentId:  req.body.appointmentId};
  
       // db.collection('invoices').find(filter).toArray(function(err, invoiceArry) {
        db.collection('invoices').findOne(filter,function(err, invoice) {
        
         
          if (err ) return  common.handleError(err, 'Error, No Invoice   record found with the given month',res,500)   
          
          if (!invoice){
            database.close();         
            return  common.handleError(err, 'No Invoice   record found with the given appointment id in Patient DB',res,500)   
          }
         database.close();              
        
         return res.json({
          status: true,
          message: 'Invoice fetch successful',
          data: invoice
        });
         
        
        });
    
     });
 
       
   
   });

   
   app.post('/api/view-invoices-bydoctor', [
    check('doctorId').not().isEmpty().trim().escape()
    
   ], function (req, res) {        
    dlog(" inside get view-appointment-bydate api   ")
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
      
   var newDate = new Date()
   
    MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
          var db = database.db()     
  
          dlog("step1.1")
          if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
  
          dlog(" Database connected successfully at updateAppointmentPatientDB")
  
          // let filter ={ "$expr": { "$eq": [{ "$month": "$appointmentDate" }, 4] } }
          let filter = { doctorId:req.body.doctorId ,"invoiceDate" : {"$gte": newDate}} 
          db.collection('invoices').find(filter).toArray(function(err, invoicesArry) {
            
          if (err ) return  common.handleError(err, 'Error, No invoice record found with the given month',res,500)   
          if (!invoicesArry || (invoicesArry && invoicesArry.length ==0)){
            database.close();              
            return  common.handleError(err, 'No invoice record found with the given doctorId id',res,500)   
          }
  
          database.close();              
          
          return res.json({
            status: true,
            message: 'All invoices retrieval by date for the given doctor successful.',
            data: invoicesArry
          });
            
  
          });
    
     });
     
  
   
    
  });
  
   app.post('/api/view-all-invoices', [    
    check('patientId').not().isEmpty().trim().escape()
  ],function (req, res) {        
     
    dlog(" inside view-all-invoices api  ")
 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
         

     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
        dlog(" Database connected successfully at view-invoices")
      
        let  filter = { patientId:  req.body.patientId};
  
        db.collection('appointments').find(filter).toArray().then(function(appointmentsArry) {
          let promises = [];
          if (err ) return  common.handleError(err, 'Error, No Invoice   record found with the given patientId',res,500)   
          
          if (!appointmentsArry || (appointmentsArry && appointmentsArry.length ==0) ){
            database.close();         
            return  common.handleError(err, 'No appointment record found with the given appointment id in Patient DB',res,500)   
          }          
          fetchInvoiceListPromises(appointmentsArry,res,db,'')        
         })
      
    
     });
 
       
   
   });
   app.post('/api/view-invoice', [    
    check('invoiceId').not().isEmpty().trim().escape()
  ],function (req, res) {        
     
    dlog(" inside view-invoices api  ")
 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
      
     dlog("invoiceId ="+req.body.invoiceId)
    let filter = { _id:new ObjectId(req.body.invoiceId)};

     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
        dlog(" Database connected successfully at view-invoices")
       
        db.collection('invoices').findOne(filter,function(err, invoice) {
        
         
          if (err ) return  common.handleError(err, 'Error, No Invoice   record found with the given month',res,500)   
          
          if (!invoice){
            database.close();         
            return  common.handleError(err, 'No Invoice   record found with the given appointment id in Patient DB',res,500)   
          }
         database.close();              
        
         return res.json({
          status: true,
          message: 'Invoice fetch successful',
          data: invoice
        });
         
        
        });
    
     });
 
       
   
   });

   app.post('/api/view-all-unpaid-invoices', [    
    check('patientId').not().isEmpty().trim().escape()
  ],function (req, res) {        
     
    dlog(" inside view-all-invoices api  ")
 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
         

     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
        dlog(" Database connected successfully at view-invoices")
      
        let  filter = { patientId:  req.body.patientId};
  
        db.collection('appointments').find(filter).toArray().then(function(appointmentsArry) {
          let promises = [];
          if (err ) return  common.handleError(err, 'Error, No Invoice   record found with the given patientId',res,500)   
          
          if (!appointmentsArry || (appointmentsArry && appointmentsArry.length ==0) ){
            database.close();         
            return  common.handleError(err, 'No appointment record found with the given appointment id in Patient DB',res,500)   
          }          
          let extra = "Unpaid"
          fetchInvoiceListPromises(appointmentsArry,res,db,extra)        
         })
      
    
     });
 
       
   
   });

   
   app.post('/api/view-all-paid-invoices', [    
    check('patientId').not().isEmpty().trim().escape()
  ],function (req, res) {        
     
    dlog(" inside view-all-invoices api  ")
 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
         

     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
        dlog(" Database connected successfully at view-invoices")
      
        let  filter = { patientId:  req.body.patientId};
  
        db.collection('appointments').find(filter).toArray().then(function(appointmentsArry) {
          let promises = [];
          if (err ) return  common.handleError(err, 'Error, No Invoice   record found with the given patientId',res,500)   
          
          if (!appointmentsArry || (appointmentsArry && appointmentsArry.length ==0) ){
            database.close();         
            return  common.handleError(err, 'No appointment record found with the given appointment id in Patient DB',res,500)   
          }          
          let extra = "paid"
          fetchInvoiceListPromises(appointmentsArry,res,db,extra)        
         })
      
    
     });
 
       
   
   });

   

  
}
