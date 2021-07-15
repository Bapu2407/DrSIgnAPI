

const {check, validationResult} = require('express-validator');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { promisify } = require("util");
const { Validator } = require('node-input-validator');
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var ObjectId = require('mongodb').ObjectID
//var axios = require('axios');

const Str = require('@supercharge/strings')

//const fsp = require("fs/promises");
module.exports = function (app) {

    app.post('/api/addDigitalmarketing',function (req, res) {    
       //try{    
           dlog(" inside addDigitalmarketing api  ")
     
           const errors = validationResult(req);
           if (!errors.isEmpty()) {
             return common.handleError(errors.array(),'Validation error.',res,999)       
           }
           
           //dlog("body ="+JSON.stringify(req.body))
     
           dlog("name ="+req.body.name)
     
           const photoRandomString = Str.random(8)  
           dlog("photoRandomString ="+photoRandomString)
     
     
           let uploadedFileNameSuf = "DigitalmarketingManualPrescription"+photoRandomString+"_"
           
           var inputCollection = req.body
           common.doFileProcessing(inputCollection,"prescription",uploadedFileNameSuf,"uploadedFile","uploadedFileURL").then((result) => {
                   inputCollection = result
                 MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
                   //   assert.equal(null, err);
                       dlog("patientDBUrl Database connected successfully at post /addDigitalmarketing")
                       
                     if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                   
                       var db = database.db()             
             
                       
                       inputCollection.active = true
                       //collection_json.appointmentDate = newDate.toISOString()//newDate
                       inputCollection.createdDate = new Date()
                       
                       db.collection('digitalmarketings').insertOne(inputCollection , function(error, response) {
                     
                         let digitalmarketing =  response.ops[0]
                         
                         //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                           
                         if (error) {
                           return common.handleError(error,'DB Insert Fail...',res,500)           
                         }
             
                         
                         return res.json({
                           status: true,
                           message: 'DB Insert Success...',
                           data: digitalmarketing
                         });
                     });
               
               });
       } , (err) => {
         let errMsg            
         errMsg = err?err.message:""
         return res.json({
           status: false,
           message: 'DB Insert fails...',
           error: errMsg
         });
       });
       
       });  
  app.post('/api/updateDigitalmarketing', [
    check('digitalmarketingId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateDigitalmarketing api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
    
   
    
      try{
       let filter  = {_id : new ObjectId(req.body.digitalmarketingId)}
      //  Digitalmarketing.findById(req.body.digitalmarketingsId, function (err, digitalmarketings) {

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("digitalmarketingsDB Database connected successfully at post /updateProfile")
             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                 var db = database.db()  
                 let fields = {}

                 let fielchange={}
                
                 if(req.body.pinCode && req.body.pinCode.trim() !=""  )
                 fielchange.pinCode = req.body.pinCode
     

                 if(req.body.distanceRange && req.body.distanceRange.trim() !=""  )
                    fielchange.distanceRange = req.body.distanceRange    
                 
                    
                 if(req.body.expressDeliveryPrice )
                 fielchange.expressDeliveryPrice = req.body.expressDeliveryPrice    
              
                 
                 if(req.body.generalDeliveryPrice  )
                    fielchange.generalDeliveryPrice = req.body.generalDeliveryPrice    
                 

                 if(req.body.active ==false){
                  fielchange.active = false
                 }
                 if(req.body.active ==true){
                  fielchange.active = true
                 }
                  
                 fielchange.updatedDate = new Date()
                
                 fielchange = {$set:fielchange}    
                 
                 dlog("fielchange == "+JSON.stringify(fielchange))             
                 db.collection('digitalmarketings').findOne(filter,function(err, digitalmarketingsRec) {
        
                    if (err ) {
                      database.close();
                     return  common.handleError(err, 'Error, in fetching digitalmarketings',res,500)   
                    }
                    
                    if (!digitalmarketingsRec){
                      database.close();              
                      return  common.handleError(err, ' No digitalmarketings record found with the given digitalmarketings ID',res,500)   
                    }

                    db.collection('digitalmarketings').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                      if (error) {
                        database.close(); 
                        return common.handleError(err, 'digitalmarketings password could not be updated',res,500)                    
                      }
                      let digitalmarketings = response.value                        
            
                      database.close();
                      return res.json({
                        status: true,
                        message: 'digitalmarketings record update Success...',
                        data: digitalmarketings
                      });
                      
                    });
                 
                });
               });
  

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Digitalmarketing password could not be updated',res,500)   
      
      }

       
    });

    app.post('/api/fetchDigitalmargeting', function (req, res) {        
        dlog(" inside fetchDigitalmarketings api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchDigitalmarketings")              
                    let filter = {"createdDate":{$exists:true}}                        
                    var pageno = req.body.pageNo
                    var perPage=req.body.perPage                
                    var skipNumber = (pageno-1)*perPage
                    dlog("pageno "+pageno)              
                    dlog("perPage "+perPage)              
                    dlog("skipNumber "+skipNumber)              
        
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                                      
                      db.collection('digitalmarketings').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, digitalmarketingsArry) {
                        let digitalmarketingsList = []
                        if (err ) {
                          database.close();             
                          return  common.handleError(err, 'Error, No digitalmarketings record found',res,500)   
                        } 
                        if (!digitalmarketingsArry || (digitalmarketingsArry && digitalmarketingsArry.length ==0)){
                          database.close();              
                          return  common.handleError(err, 'No digitalmarketings record foundin Patient DB',res,500)   
                        }
                        
                  
                        database.close();              
                        
                        return res.json({
                          status: true,
                          message: 'digitalmarketings retrieval  successful.',
                          data: digitalmarketingsArry
                        });
                          
                  
                        });
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving digitalmarketings record',res,500)
        
        }      
        });
        
        
        /*
          ************
         6. fetchDigitalmarketings Count API
          ************
        */
        
        
        app.post('/api/fetchDigitalmarketingCount', function (req, res) {        
        dlog(" inside fetchDigitalmarketingsCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchDigitalmarketings")
                    
                    
                    let filter = {"createdDate":{$exists:true}} 
                                
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('digitalmarketings').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No digitalmarketings record found',res,500)   
                      }
                      var output
                      if(result ==undefined){
                        output={
                              "recordCount": 0
                          }
                      }else{
                        output={
                                "recordCount": result
                            }
                      }
        
                      database.close();             
        
                      return res.json({
                        status: true,
                        message: 'digitalmarketings record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving digitalmarketings record',res,500)
        
        }      
        });
        
        app.post('/api/fetch-all-digitalmarketingss',function (req, res) {        
          dlog(" inside all-patients api  ")
        
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
           var db = database.db()     
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
             
           dlog(" Database connected successfully at all-patients")
           
           let filter = {active:true}  
        
           db.collection('digitalmarketings').find(filter).toArray(function(err, patientArry) {
               
               if (err ) return  common.handleError(err, 'Error, Erro fetching patient ',res,500)   
               if (!patientArry || (patientArry && patientArry.length ==0)){
                 database.close();                  
                 return  common.handleError(err, 'No patientArry record found with the given city Or Area or address',res,500)   
               }
               database.close();                  
               return res.json({
                 status: true,
                 message: 'Patient array retrieval success...',
                 //data: doctorIdList
                 data : patientArry
                 });              
             
             });
         
          });
        
        });
    
}