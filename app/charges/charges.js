

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


  app.post('/api/addCharges', [    
   check('serviceChargeName').not().isEmpty().trim().escape(),
   check('serviceChargeAmount').not().isEmpty().escape()
   
],function (req, res) {    
  //try{    
      dlog(" inside addCharges api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation Error',res,999)       
      }
      
      //dlog("body ="+JSON.stringify(req.body))

      //dlog("name ="+req.body.name)

      var inputCollection = req.body
 
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        //   assert.equal(null, err);
            dlog("patientDBUrl Database connected successfully at post /addCharges")
            
          if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
            var db = database.db()             
  
            
            inputCollection.active = true
            //collection_json.appointmentDate = newDate.toISOString()//newDate
            inputCollection.createdDate = new Date()
            
            db.collection('charges').insertOne(inputCollection , function(error, response) {
          
              let charges =  response.ops[0]
              
              //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                
              if (error) {
                return common.handleError(error,'DB Insert Fail...',res,500)           
              }
  
              
              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: charges
              });
          });
    
    });
         
  
  });

  app.post('/api/fetchMedicinechargesDetails', [
    check('chargesId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchchargesDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    let filter  = {_id : new ObjectId(req.body.chargesId)}
      try{       
    

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("chargesDB Database connected successfully at post /login-charges ")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('charges').findOne(filter,function(error, charges) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching charges record',res,500)                    
                    }
                  if (!charges ) {
                    database.close(); 
                    return common.handleError(err, 'charges could not be found',res,500)                    
                  }
                  
                  charges.uploadPhotoDemographic = ''
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'fetch Success...',
                    data: charges
                  });
                    
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving charges record',res,500)   
      
      }       
   
    
  });
  app.post('/api/updateMedicineCharges', [
    check('chargesId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateCharges api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
    
   
    
      try{
       let filter  = {_id : new ObjectId(req.body.chargesId)}
      //  Charges.findById(req.body.chargesId, function (err, charges) {

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("chargesDB Database connected successfully at post /updateProfile")
             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                 var db = database.db()  
                 let fields = {}

                 let fielchange={}
                
                 if(req.body.serviceChargeName && req.body.serviceChargeName.trim() !=""  )
                 fielchange.serviceChargeName = req.body.serviceChargeName
     

                 if(req.body.serviceChargeAmount  )
                    fielchange.serviceChargeAmount = req.body.serviceChargeAmount    
                 

                 if(req.body.active ==false){
                  fielchange.active = false
                 }
                 if(req.body.active ==true){
                  fielchange.active = true
                 }
                  
                 fielchange.updatedDate = new Date()
                
                 fielchange = {$set:fielchange}    
                 
                 dlog("fielchange == "+JSON.stringify(fielchange))             
                 db.collection('charges').findOne(filter,function(err, chargesRec) {
        
                    if (err ) {
                      database.close();
                     return  common.handleError(err, 'Error, in fetching charges',res,500)   
                    }
                    
                    if (!chargesRec){
                      database.close();              
                      return  common.handleError(err, ' No charges record found with the given charges ID',res,500)   
                    }

                    db.collection('charges').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                      if (error) {
                        database.close(); 
                        return common.handleError(err, 'charges password could not be updated',res,500)                    
                      }
                      let charges = response.value                        
            
                      database.close();
                      return res.json({
                        status: true,
                        message: 'charges record update Success...',
                        data: charges
                      });
                      
                    });
                 
                });
               });
  

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Charges password could not be updated',res,500)   
      
      }

       
    });

    app.post('/api/fetchServiceChargess', function (req, res) {        
        dlog(" inside fetchChargess api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchChargess")              
                    let filter = {"serviceChargeName":{$exists:true}}                        
                    var pageno = req.body.pageNo
                    var perPage=req.body.perPage                
                    var skipNumber = (pageno-1)*perPage
                    dlog("pageno "+pageno)              
                    dlog("perPage "+perPage)              
                    dlog("skipNumber "+skipNumber)              
        
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                                      
                      db.collection('charges').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, chargesArry) {
                        let chargesList = []
                        if (err ) {
                          database.close();             
                          return  common.handleError(err, 'Error, No charges record found',res,500)   
                        } 
                        if (!chargesArry || (chargesArry && chargesArry.length ==0)){
                          database.close();              
                          return  common.handleError(err, 'No charges record foundin Patient DB',res,500)   
                        }
                        for( var i in chargesArry){  
                          let charges = chargesArry[i]
                        //  charges.uploadPhotoDemographic = ''
                        //  charges.uploadPhotoProfessional = ''                    
                          chargesList.push(charges)                                
                        }
                  
                        database.close();              
                        
                        return res.json({
                          status: true,
                          message: 'charges retrieval  successful.',
                          data: chargesList
                        });
                          
                  
                        });
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving charges record',res,500)
        
        }      
        });
        
        
        /*
          ************
         6. fetchChargess Count API
          ************
        */
        
        
        app.post('/api/fetchServiceChargessCount', function (req, res) {        
        dlog(" inside fetchChargessCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchChargess")
                    
                    
                    let filter = {"serviceChargeName":{$exists:true}} 
                                
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('charges').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No charges record found',res,500)   
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
                        message: 'charges record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving charges record',res,500)
        
        }      
        });
        
        app.post('/api/fetch-all-chargess',function (req, res) {        
          dlog(" inside all-patients api  ")
        
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
           var db = database.db()     
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
             
           dlog(" Database connected successfully at all-patients")
           
           let filter = {active:true}  
        
           db.collection('charges').find(filter).toArray(function(err, patientArry) {
               
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