

const {check, validationResult} = require('express-validator');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { promisify } = require("util");
const { Validator } = require('node-input-validator');
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var ObjectId = require('mongodb').ObjectID
//var axios = require('axios');



//const fsp = require("fs/promises");
module.exports = function (app) {


  app.post('/api/addDeliverys', [    
   check('pinCode').not().isEmpty().trim().escape(),
   check('expressDeliveryPrice').not().isEmpty().escape(),
   check('generalDeliveryPrice').not().isEmpty().escape()
],function (req, res) {    
  //try{    
      dlog(" inside addDeliverys api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }
      
      //dlog("body ="+JSON.stringify(req.body))

      //dlog("name ="+req.body.name)

      var inputCollection = req.body
 
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        //   assert.equal(null, err);
            dlog("patientDBUrl Database connected successfully at post /addDeliverys")
            
          if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
            var db = database.db()             
  
            
            inputCollection.active = true
            //collection_json.appointmentDate = newDate.toISOString()//newDate
            inputCollection.createdDate = new Date()
            
            db.collection('deliveries').insertOne(inputCollection , function(error, response) {
          
              let shippingCharges =  response.ops[0]
              
              //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                
              if (error) {
                return common.handleError(error,'DB Insert Fail...',res,500)           
              }
  
              
              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: shippingCharges
              });
          });
    
    });
         
  
  });
  app.post('/api/fetch-all-pincode-autocom', [
    check('pinCode').not().isEmpty().trim().escape()
   ],function (req, res) {        
    dlog(" inside all-pincode api  ")
  
    MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  
     var db = database.db()     
     if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
       
     dlog(" Database connected successfully ")
  
     //let filter  =  {  name: {'$regex':req.body.name, $options: '-i' } }

     let filter ={$and : [{  pinCode: {'$regex':req.body.pinCode, $options: '-i' } },{active: true}]}  
  
     //db.collection('medicinedumps').find(filter).toArray(function(err, medicineArry) {
      db.collection('deliveries').find(filter).toArray(function(err, pincodeArry) {
         
         if (err ) return  common.handleError(err, 'Error, Erro fetching pin code ',res,500)   
         if (!pincodeArry || (pincodeArry && pincodeArry.length ==0)){
           database.close();                  
           return  common.handleError(err, 'No pin code record found',res,500)   
         }
         database.close();                  
         return res.json({
           status: true,
           message: 'Pin Code array retrieval success...',
           //data: doctorIdList
           data : pincodeArry
           });              
       
       });
   
    });
  
  });
  app.post('/api/fetchShippingChargesDetails', [
    check('shippingChargesId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchshippingChargesDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    let filter  = {_id : new ObjectId(req.body.shippingChargesId)}
      try{       
    

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("shippingChargesDB Database connected successfully at post /login-shippingCharges ")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('deliveries').findOne(filter,function(error, shippingCharges) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching shippingCharges record',res,500)                    
                    }
                  if (!shippingCharges ) {
                    database.close(); 
                    return common.handleError(err, 'shippingCharges could not be found',res,500)                    
                  }
                  
                  shippingCharges.uploadPhotoDemographic = ''
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'fetch Success...',
                    data: shippingCharges
                  });
                    
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving shippingCharges record',res,500)   
      
      }       
   
    
  });
  app.post('/api/updateDeliverys', [
    check('deliveryId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateDeliverys api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
    
   
    
      try{
       let filter  = {_id : new ObjectId(req.body.deliveryId)}
      //  Deliverys.findById(req.body.shippingChargesId, function (err, shippingCharges) {

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("shippingChargesDB Database connected successfully at post /updateProfile")
             
                            
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
                 db.collection('deliveries').findOne(filter,function(err, shippingChargesRec) {
        
                    if (err ) {
                      database.close();
                     return  common.handleError(err, 'Error, in fetching shippingCharges',res,500)   
                    }
                    
                    if (!shippingChargesRec){
                      database.close();              
                      return  common.handleError(err, ' No shippingCharges record found with the given shippingCharges ID',res,500)   
                    }

                    db.collection('deliveries').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                      if (error) {
                        database.close(); 
                        return common.handleError(err, 'shippingCharges password could not be updated',res,500)                    
                      }
                      let shippingCharges = response.value                        
            
                      database.close();
                      return res.json({
                        status: true,
                        message: 'shippingCharges record update Success...',
                        data: shippingCharges
                      });
                      
                    });
                 
                });
               });
  

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Deliverys password could not be updated',res,500)   
      
      }

       
    });

    app.post('/api/fetchDeliverys', function (req, res) {        
        dlog(" inside fetchDeliveryss api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchDeliveryss")              
                    let filter = {"pinCode":{$exists:true}}                        
                    var pageno = req.body.pageNo
                    var perPage=req.body.perPage                
                    var skipNumber = (pageno-1)*perPage
                    dlog("pageno "+pageno)              
                    dlog("perPage "+perPage)              
                    dlog("skipNumber "+skipNumber)              
        
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                                      
                      db.collection('deliveries').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, shippingChargesArry) {
                        let shippingChargesList = []
                        if (err ) {
                          database.close();             
                          return  common.handleError(err, 'Error, No shippingCharges record found',res,500)   
                        } 
                        if (!shippingChargesArry || (shippingChargesArry && shippingChargesArry.length ==0)){
                          database.close();              
                          return  common.handleError(err, 'No shippingCharges record foundin Patient DB',res,500)   
                        }
                        for( var i in shippingChargesArry){  
                          let shippingCharges = shippingChargesArry[i]
                          shippingCharges.uploadPhotoDemographic = ''
                          shippingCharges.uploadPhotoProfessional = ''                    
                          shippingChargesList.push(shippingCharges)                                
                        }
                  
                        database.close();              
                        
                        return res.json({
                          status: true,
                          message: 'shippingCharges retrieval  successful.',
                          data: shippingChargesList
                        });
                          
                  
                        });
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving shippingCharges record',res,500)
        
        }      
        });
        
        
        /*
          ************
         6. fetchDeliveryss Count API
          ************
        */
        
        
        app.post('/api/fetchDeliverysCount', function (req, res) {        
        dlog(" inside fetchDeliveryssCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchDeliveryss")
                    
                    
                    let filter = {"pinCode":{$exists:true}} 
                                
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('deliveries').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No shippingCharges record found',res,500)   
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
                        message: 'shippingCharges record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving shippingCharges record',res,500)
        
        }      
        });
        
        app.post('/api/fetch-all-shippingChargess',function (req, res) {        
          dlog(" inside all-patients api  ")
        
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
           var db = database.db()     
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
             
           dlog(" Database connected successfully at all-patients")
           
           let filter = {active:true}  
        
           db.collection('deliveries').find(filter).toArray(function(err, patientArry) {
               
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