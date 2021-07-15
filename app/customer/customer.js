

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


  app.post('/api/addCustomer', [
    
   check('name').not().isEmpty().trim().escape(),   
   check('addressline1').not().isEmpty().trim(),   
   //check('password').not().isEmpty().trim().escape(),
   check('emailId').not().isEmpty().trim().isEmail().normalizeEmail(),
   check('mobileNumber').not().isEmpty().trim(),   
   check('area').not().isEmpty().trim()   
],function (req, res) {    
  //try{    
      dlog(" inside addCustomer api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }
      
      //dlog("body ="+JSON.stringify(req.body))

      dlog("name ="+req.body.name)

      var inputCollection = req.body
 
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        //   assert.equal(null, err);
            dlog("patientDBUrl Database connected successfully at post /addCustomer")
            
          if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
            var db = database.db()             
  
            
            inputCollection.active = true
            //collection_json.appointmentDate = newDate.toISOString()//newDate
            inputCollection.createdDate = new Date()
            
            db.collection('customers').insertOne(inputCollection , function(error, response) {
          
              let customer =  response.ops[0]
              
              //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                
              if (error) {
                return common.handleError(error,'DB Insert Fail...',res,500)           
              }
  
              
              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: customer
              });
          });
    
    });
         
  
  });

  app.post('/api/fetchcustomerDetails', [
    check('customerId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchcustomerDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    let filter  = {_id : new ObjectId(req.body.customerId)}
      try{       
    

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("customerDB Database connected successfully at post /login-customer ")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('customers').findOne(filter,function(error, customer) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching customer record',res,500)                    
                    }
                  if (!customer ) {
                    database.close(); 
                    return common.handleError(err, 'customer could not be found',res,500)                    
                  }
                  
                  customer.uploadPhotoDemographic = ''
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'fetch Success...',
                    data: customer
                  });
                    
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving customer record',res,500)   
      
      }       
   
    
  });
  app.post('/api/updateCustomer', [
    check('customerId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateCustomer api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
    
   
    
      try{
       let filter  = {_id : new ObjectId(req.body.customerId)}
      //  Customer.findById(req.body.customerId, function (err, customer) {

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("customerDB Database connected successfully at post /updateProfile")
             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                 var db = database.db()  
                 let fields = {}

                 let fielchange={}
                
                 if(req.body.name && req.body.name.trim() !=""  )
                 fielchange.name = req.body.name
     

                 if(req.body.emailId && req.body.emailId.trim() !=""  )
                    fielchange.emailId = req.body.emailId    
                 
                 if(req.body.age && req.body.age.trim() !=""  )
                    fielchange.age = req.body.age
                 
                 if(req.body.sex && req.body.sex.trim() !=""  )
                    fielchange.sex = req.body.sex
                 
                 if(req.body.addressline1 && req.body.addressline1.trim() !=""  )
                    fielchange.addressline1 = req.body.addressline1
                 
                 if(req.body.addressline2 && req.body.addressline2.trim() !=""  )
                    fielchange.addressline2 = req.body.addressline2
     
                 if(req.body.area && req.body.area.trim() !=""  )
                 fielchange.area = req.body.area
                 if(req.body.po && req.body.po.trim() !=""  )
                 fielchange.po = req.body.po
                 if(req.body.pin && req.body.pin.trim() !=""  )
                 fielchange.pin = req.body.pin
     
                 if(req.body.state && req.body.state.trim() !=""  )
                  fielchange.state = req.body.state
     
                 

                 if(req.body.mobileNumber && req.body.mobileNumber.trim() !=""  )
                 fielchange.mobileNumber = req.body.mobileNumber

                 if(req.body.alternateMobileNumber && req.body.alternateMobileNumber.trim() !=""  )
                 fielchange.alternateMobileNumber = req.body.alternateMobileNumber
     
                 if(req.body.district && req.body.district.trim() !="" )
                 fielchange.district = req.body.district

                 if(req.body.landmark && req.body.landmark.trim() !="" )
                    fielchange.landmark = req.body.landmark

                 if(req.body.landmark && req.body.landmark.trim() !="" )
                    fielchange.landmark = req.body.landmark


                 if(req.body.active ==false){
                  fielchange.active = false
                 }
                 if(req.body.active ==true){
                  fielchange.active = true
                 }
                  
                 fielchange.updatedDate = new Date()
                
                 fielchange = {$set:fielchange}    
                 
                 dlog("fielchange == "+JSON.stringify(fielchange))             
                 db.collection('customers').findOne(filter,function(err, customerRec) {
        
                    if (err ) {
                      database.close();
                     return  common.handleError(err, 'Error, in fetching customer',res,500)   
                    }
                    
                    if (!customerRec){
                      database.close();              
                      return  common.handleError(err, ' No customer record found with the given customer ID',res,500)   
                    }

                    db.collection('customers').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                      if (error) {
                        database.close(); 
                        return common.handleError(err, 'customer password could not be updated',res,500)                    
                      }
                      let customer = response.value                        
            
                      database.close();
                      return res.json({
                        status: true,
                        message: 'customer record update Success...',
                        data: customer
                      });
                      
                    });
                 
                });
               });
  

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Customer password could not be updated',res,500)   
      
      }

       
    });

    app.post('/api/fetchCustomers', function (req, res) {        
        dlog(" inside fetchCustomers api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchCustomers")              
                    let filter = {"emailId":{$exists:true}}                        
                    var pageno = req.body.pageNo
                    var perPage=req.body.perPage                
                    var skipNumber = (pageno-1)*perPage
                    dlog("pageno "+pageno)              
                    dlog("perPage "+perPage)              
                    dlog("skipNumber "+skipNumber)              
        
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                                      
                      db.collection('customers').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, customerArry) {
                        let customerList = []
                        if (err ) {
                          database.close();             
                          return  common.handleError(err, 'Error, No customer record found',res,500)   
                        } 
                        if (!customerArry || (customerArry && customerArry.length ==0)){
                          database.close();              
                          return  common.handleError(err, 'No customer record foundin Patient DB',res,500)   
                        }
                        for( var i in customerArry){  
                          let customer = customerArry[i]
                          customer.uploadPhotoDemographic = ''
                          customer.uploadPhotoProfessional = ''                    
                          customerList.push(customer)                                
                        }
                  
                        database.close();              
                        
                        return res.json({
                          status: true,
                          message: 'customer retrieval  successful.',
                          data: customerList
                        });
                          
                  
                        });
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving customer record',res,500)
        
        }      
        });
        
        
        /*
          ************
         6. fetchCustomers Count API
          ************
        */
        
        
        app.post('/api/fetchCustomersCount', function (req, res) {        
        dlog(" inside fetchCustomersCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchCustomers")
                    
                    
                    let filter = {"emailId":{$exists:true}} 
                                
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('customers').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No customer record found',res,500)   
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
                        message: 'customer record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving customer record',res,500)
        
        }      
        });
        
        app.post('/api/fetch-all-customers',function (req, res) {        
          dlog(" inside all-patients api  ")
        
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
           var db = database.db()     
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
             
           dlog(" Database connected successfully at all-patients")
           
           let filter = {active:true}  
        
           db.collection('customers').find(filter).toArray(function(err, patientArry) {
               
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