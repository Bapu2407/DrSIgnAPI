

const {check, validationResult} = require('express-validator');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { promisify } = require("util");
const { Validator } = require('node-input-validator');
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var ObjectId = require('mongodb').ObjectID
//var axios = require('axios');

const figureOutFilter =  (filter) => {
                
  //   if(req.body.fetchOrderByCustomer ==true){
      // filter = {"customerId":req.body.customerId}                           
   //  }
   let finalFilter = {}
   //console.log("req.body and part == "+JSON.stringify(filter['$and']))
   if(filter && filter !=null && filter != ''){
   
 //  let createDatePart = filter['$and']['createdDate']
 //  delete filter['$and']['createdDate']
   let andPartArray = filter['$and']

  // delete filter['$and']['createdDate']
   let fileterArray = []
   let createDatePart = ''
   let medicineIDSearch = ''
   for(var i in andPartArray){
     let individualFilter = andPartArray[i]
     
     if(individualFilter['medicineIDSearch'] && individualFilter['medicineIDSearch'] != 'undefined' ){
      medicineIDSearch = individualFilter['medicineIDSearch'] 
       continue
     }
     console.log("individualFilter == "+JSON.stringify(individualFilter))
    
   }

   if(medicineIDSearch){ 
     fileterArray.push({_id : new ObjectId(medicineIDSearch)})
   }

   
     finalFilter = {'$and':fileterArray}
   }else{
     finalFilter = {"active":{$exists:true}} 
   }
   return finalFilter
}



const getecatgories = async (medArry) =>{
  let promises = []
  var  appointmentNewArray= []
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
    try{
    medArry.forEach(function(medicine, index){
   
      
     
            promises.push( new Promise(resolve => {     
              if( medicine.category && ObjectId.isValid(medicine.category)){

              MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              var db = database.db()     
              let filterLocation  = {_id : new ObjectId(medicine.category)}

              db.collection('medicine-categories').findOne(filterLocation,function(error, category) {
                if (error ) {
                    database.close(); 
                    resolve(medicine)
                    //return common.handleError(err, 'Error fetching patient record',res,500)                    
                  }
                if (!category ) {
                  database.close(); 
                  resolve(medicine)
                  //return common.handleError(err, 'location could not be found',res,500)                    
                }
                
                medicine.categoryObj = category
              // resolve({appointment:appointment,location:location})
              resolve(medicine)
              
            });
            
          });

        }else{
          resolve(medicine)
        }
      
    
        }));
   
  
    })

  }catch(err)
  {
   dlog(err) 
  }
    
    return Promise.all(promises)
}
const getMedicineCategory = async (medArry,res) =>{
      
  
  medArry = await getecatgories(medArry)

  dlog("medArry == "+JSON.stringify(medArry)) 
  // database.close();                          
   return res.json({
     status: true,
     message: 'Medicine Arry retrieval successful.',
     data: medArry
   });



}




//const fsp = require("fs/promises");
module.exports = function (app) {


  app.post('/api/addMedicine'/*, [
    
   check('name').not().isEmpty().trim().escape(),   
   check('addressline1').not().isEmpty().trim(),   
   //check('password').not().isEmpty().trim().escape(),
   check('emailId').not().isEmpty().trim().isEmail().normalizeEmail(),
   check('mobileNumber').not().isEmpty().trim(),   
   check('area').not().isEmpty().trim()   
]*/,function (req, res) {    
  //try{    
      dlog(" inside addMedicine api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }
      
      //dlog("body ="+JSON.stringify(req.body))

      dlog("name ="+req.body.name)

      var inputCollection = req.body
 
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        //   assert.equal(null, err);
            dlog("patientDBUrl Database connected successfully at post /addMedicine")
            
          if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
            var db = database.db()             
  
            
            inputCollection.active = true
            //collection_json.appointmentDate = newDate.toISOString()//newDate
            inputCollection.createdDate = new Date()
            
            db.collection('medicines').insertOne(inputCollection , function(error, response) {
          
              let medicine =  response.ops[0]
              
              //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                
              if (error) {
                return common.handleError(error,'DB Insert Fail...',res,500)           
              }
  
              
              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: medicine
              });
          });
    
    });
         
  
  });

  app.post('/api/insertBulkMedicine',function (req, res) {    
   //try{    
       dlog(" inside insertBulkMedicine api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)       
       }
       
       //dlog("body ="+JSON.stringify(req.body))
       var newArray = []
       var inputCollection = req.body
       for(var i in inputCollection){
         var obj  = inputCollection[i]
        var newDate = common.convertStringTodate(obj.createdDate) 
        obj.createdDate = newDate
        newArray.push(obj)

       }
       
 
       dlog("newArray ="+JSON.stringify(newArray))
 
       
  
       MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
         //   assert.equal(null, err);
             dlog("patientDBUrl Database connected successfully at post /addMedicine")
             
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
         
             var db = database.db()                             
             db.collection('medicines').insertMany(newArray , function(error, response) {
              let medicineIdList
              if(response){
               medicineIdList =  response.insertedIds
              }else{
                return common.handleError(error,'Bulk Medicine Import has failed..',res,500)           
              }
               
               //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                 
               if (error) {
                 return common.handleError(error,'Bulk Medicine Import has failed..',res,500)           
               }
   
               
               return res.json({
                 status: true,
                 message: 'Bulk Medicine Import Has Succeeded...',
                 data: medicineIdList
               });
           });
     
     });
          
   
   });
 

  app.post('/api/fetchmedicineDetails', [
    check('medicineId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchmedicineDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    let filter  = {_id : new ObjectId(req.body.medicineId)}
      try{       
    

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("medicineDB Database connected successfully at post /login-medicine ")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('medicines').findOne(filter,function(error, medicine) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching medicine record',res,500)                    
                    }
                  if (!medicine ) {
                    database.close(); 
                    return common.handleError(err, 'medicine could not be found',res,500)                    
                  }
                  
                  medicine.uploadPhotoDemographic = ''
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'fetch Success...',
                    data: medicine
                  });
                    
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving medicine record',res,500)   
      
      }       
   
    
  });
  app.post('/api/updateMedicine', [
    check('medicineId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateMedicine api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
    
   
    
      try{
       let filter  = {_id : new ObjectId(req.body.medicineId)}
      //  Medicine.findById(req.body.medicineId, function (err, medicine) {

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("medicineDB Database connected successfully at post /updateProfile")
             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                 var db = database.db()  
                 let fields = {}

                 let fielchange={}
                /*
                 name:"",
      mrp:"",      
      active:true,      
      "b2bPrice" : "",
      "gst" : "0",
      "vat" : "0",
      "otherTax" : "0",
      "discounts" : "0",
      "medicineType" : "",      
      "category" : ""
    }

    */
                if(req.body.name && req.body.name.trim() !=""  )
                 fielchange.name = req.body.name
     

                 if(req.body.b2bPrice && req.body.b2bPrice !=""  )
                    fielchange.b2bPrice = req.body.b2bPrice    
                 
                 if(req.body.gst && req.body.gst !=""  )
                    fielchange.gst = req.body.gst
                 
                 if(req.body.vat && req.body.vat !=""  )
                    fielchange.vat = req.body.vat
                 
                 if(req.body.otherTax && req.body.otherTax !=""  )
                    fielchange.otherTax = req.body.otherTax
                 
                 if(req.body.discounts && req.body.discounts !=""  )
                    fielchange.discounts = req.body.discounts
     
                 if(req.body.medicineType && req.body.medicineType.trim() !=""  )
                    fielchange.medicineType = req.body.medicineType


                 if(req.body.category && req.body.category.trim() !=""  )
                 fielchange.category = req.body.category
                 
                 if(req.body.active ==false){
                  fielchange.active = false
                 }
                 if(req.body.active ==true){
                  fielchange.active = true
                 }
                  
                 fielchange.updatedDate = new Date()
                
                 fielchange = {$set:fielchange}    
                 
                 dlog("fielchange == "+JSON.stringify(fielchange))             
                 db.collection('medicines').findOne(filter,function(err, medicineRec) {
        
                    if (err ) {
                      database.close();
                     return  common.handleError(err, 'Error, in fetching medicine',res,500)   
                    }
                    
                    if (!medicineRec){
                      database.close();              
                      return  common.handleError(err, ' No medicine record found with the given medicine ID',res,500)   
                    }

                    db.collection('medicines').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                      if (error) {
                        database.close(); 
                        return common.handleError(err, 'medicine password could not be updated',res,500)                    
                      }
                      let medicine = response.value                        
            
                      database.close();
                      return res.json({
                        status: true,
                        message: 'medicine record update Success...',
                        data: medicine
                      });
                      
                    });
                 
                });
               });
  

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Medicine password could not be updated',res,500)   
      
      }

       
    });

    app.post('/api/fetchMedicines', function (req, res) {        
        dlog(" inside fetchMedicines api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchMedicines")              
                    let filter = {"name":{$exists:true}}                        
                    var pageno = req.body.pageNo
                    var perPage=req.body.perPage                
                    var skipNumber = (pageno-1)*perPage
                    dlog("pageno "+pageno)              
                    dlog("perPage "+perPage)              
                    dlog("skipNumber "+skipNumber)              
        
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                                      
                      db.collection('medicines').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, medicineArry) {
                        let medicineList = []
                        if (err ) {
                          database.close();             
                          return  common.handleError(err, 'Error, No medicine record found',res,500)   
                        } 
                        if (!medicineArry || (medicineArry && medicineArry.length ==0)){
                          database.close();              
                          return  common.handleError(err, 'No medicine record foundin Patient DB',res,500)   
                        }
                      
                        
                        database.close();    
                        getMedicineCategory(medicineArry,res)          
                        /*
                        return res.json({
                          status: true,
                          message: 'medicine retrieval  successful.',
                          data: medicineList
                        });
                          */
                  
                        });
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving medicine record',res,500)
        
        }      
        });
        
        
        /*
          ************
         6. fetchMedicines Count API
          ************
        */
        
        
        app.post('/api/fetchMedicinesCount', function (req, res) {        
        dlog(" inside fetchMedicinesCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchMedicines")
                    
                    
                    let filter = {"name":{$exists:true}} 
                                
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('medicines').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No medicine record found',res,500)   
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
                        message: 'medicine record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving medicine record',res,500)
        
        }      
        });
        
        app.post('/api/fetch-all-medicines',function (req, res) {        
          dlog(" inside all-patients api  ")
        
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
           var db = database.db()     
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
             
           dlog(" Database connected successfully at all-patients")
           
           let filter = {active:true}  
        
           db.collection('medicines').find(filter).toArray(function(err, patientArry) {
               
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

        app.post('/api/fetchMedicineCategory', function (req, res) {        
            dlog(" inside get fetchMedicineCategory  api  by doctorID ")
        
            try{       
             
              MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
                //   assert.equal(null, err);
                    dlog("doctorDB Database connected successfully at post /fetchMedicineCategory")
                   
                    var db = database.db()
           
                    db.collection('medicine-categories').find().toArray(function(err, medicineCategoryArry) {
        
                      if (err || !medicineCategoryArry) {
                        database.close();
                        return  common.handleError(err, 'No Practice Category record found with the given doctor ID',res,200)   
                      }
        
                      database.close();
                      return res.json({
                        status: true,
                        message: 'Practice Category retrieval success...',
                        data: medicineCategoryArry
                      });
        
                    });
                });
            }catch(error){
              //console.error(error)
              return  common.handleError(error, 'Error retrieving Practice location  record',res,500)   
            
            }     
            
          });
    

          
    app.post('/api/fetchMedicinesByFilters', function (req, res) {        
      dlog(" inside fetchMedicinesByFilters api  ")
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(), 'validation error.',res,999)   
      }
      
      try{     
        
        
        //  Patient.findById(req.body.patientId, function (err, patient) {
      
          console.log("req.body == "+JSON.stringify(req.body))

          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
            //   assert.equal(null, err);
                  dlog("patientDB Database connected successfully at post /fetchMedicines")              
                                   
                 
                let filter = figureOutFilter(req.body.filter)
              //  console.log("finalFilter == "+JSON.stringify(finalFilter))

                  var pageno = req.body.pageNo
                  var perPage=req.body.perPage                
                  var skipNumber = (pageno-1)*perPage
                  dlog("pageno "+pageno)              
                  dlog("perPage "+perPage)              
                  dlog("skipNumber "+skipNumber)              
      
                  if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                   var db = database.db()  
                                    
                   db.collection('medicines').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, medicineArry) {
                    let medicineList = []
                    if (err ) {
                      database.close();             
                      return  common.handleError(err, 'Error, No medicine record found',res,500)   
                    } 
                    if (!medicineArry || (medicineArry && medicineArry.length ==0)){
                      database.close();              
                      return  common.handleError(err, 'No medicine record foundin Patient DB',res,500)   
                    }
                  
                    
                    database.close();    
                    getMedicineCategory(medicineArry,res)          
                    /*
                    return res.json({
                      status: true,
                      message: 'medicine retrieval  successful.',
                      data: medicineList
                    });
                      */
              
                    });
                });
      
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving order record',res,500)
      
      }      
      });
      

      app.post('/api/fetchMedicinesByFilterCount', function (req, res) {        
        dlog(" inside fetchMedicinesCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchMedicines")
                    
                    /*
                    let filter = {"active":{$exists:true}} 
                                   
                    if(req.body.fetchOrderByCustomer == true){
                      filter = {"customerId":req.body.customerId}                           
                    }
                    */
                   let filter = figureOutFilter(req.body.filter)
                              
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('medicines').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No medicine record found',res,500)   
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
                        message: 'medicine record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                  
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving order record',res,500)
        
        }      
        });
        
        /*
          ************
         6. fetchMedicines Count API
          ************
        */
        
}