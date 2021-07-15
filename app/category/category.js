

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


  app.post('/api/addCategory', [    
   check('catValue').not().isEmpty().trim().escape()
],function (req, res) {    
  //try{    
      dlog(" inside addCategory api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }
      
      //dlog("body ="+JSON.stringify(req.body))

      //dlog("name ="+req.body.name)

      var inputCollection = req.body
 
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        //   assert.equal(null, err);
            dlog("patientDBUrl Database connected successfully at post /addCategory")
            
          if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
            var db = database.db()             
  
            
            inputCollection.active = true
            //collection_json.appointmentDate = newDate.toISOString()//newDate
            inputCollection.createdDate = new Date()
            
            db.collection('medicine-categories').insertOne(inputCollection , function(error, response) {
          
              let category =  response.ops[0]
              
              //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                
              if (error) {
                return common.handleError(error,'DB Insert Fail...',res,500)           
              }
  
              
              return res.json({
                status: true,
                message: 'DB Insert Success...',
                data: category
              });
          });
    
    });
         
  
  });

  app.post('/api/fetchMedicinecategoryDetails', [
    check('categoryId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchcategoryDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    let filter  = {_id : new ObjectId(req.body.categoryId)}
      try{       
    

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("categoryDB Database connected successfully at post /login-category ")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('medicine-categories').findOne(filter,function(error, category) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching category record',res,500)                    
                    }
                  if (!category ) {
                    database.close(); 
                    return common.handleError(err, 'category could not be found',res,500)                    
                  }
                  
                  category.uploadPhotoDemographic = ''
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'fetch Success...',
                    data: category
                  });
                    
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving category record',res,500)   
      
      }       
   
    
  });
  app.post('/api/updateMedicineCategory', [
    check('categoryId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateCategory api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
    
   
    
      try{
       let filter  = {_id : new ObjectId(req.body.categoryId)}
      //  Category.findById(req.body.categoryId, function (err, category) {

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("categoryDB Database connected successfully at post /updateProfile")
             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                 var db = database.db()  
                 let fields = {}

                 let fielchange={}
                
                 if(req.body.catValue && req.body.catValue.trim() !=""  )
                 fielchange.catValue = req.body.catValue
     

                 if(req.body.spclAttribute && req.body.spclAttribute.trim() !=""  )
                    fielchange.spclAttribute = req.body.spclAttribute    
                 

                 if(req.body.active ==false){
                  fielchange.active = false
                 }
                 if(req.body.active ==true){
                  fielchange.active = true
                 }
                  
                 fielchange.updatedDate = new Date()
                
                 fielchange = {$set:fielchange}    
                 
                 dlog("fielchange == "+JSON.stringify(fielchange))             
                 db.collection('medicine-categories').findOne(filter,function(err, categoryRec) {
        
                    if (err ) {
                      database.close();
                     return  common.handleError(err, 'Error, in fetching category',res,500)   
                    }
                    
                    if (!categoryRec){
                      database.close();              
                      return  common.handleError(err, ' No category record found with the given category ID',res,500)   
                    }

                    db.collection('medicine-categories').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                      if (error) {
                        database.close(); 
                        return common.handleError(err, 'category password could not be updated',res,500)                    
                      }
                      let category = response.value                        
            
                      database.close();
                      return res.json({
                        status: true,
                        message: 'category record update Success...',
                        data: category
                      });
                      
                    });
                 
                });
               });
  

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Category password could not be updated',res,500)   
      
      }

       
    });

    app.post('/api/fetchCategorys', function (req, res) {        
        dlog(" inside fetchCategorys api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchCategorys")              
                    let filter = {"catValue":{$exists:true}}                        
                    var pageno = req.body.pageNo
                    var perPage=req.body.perPage                
                    var skipNumber = (pageno-1)*perPage
                    dlog("pageno "+pageno)              
                    dlog("perPage "+perPage)              
                    dlog("skipNumber "+skipNumber)              
        
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                                      
                      db.collection('medicine-categories').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, categoryArry) {
                        let categoryList = []
                        if (err ) {
                          database.close();             
                          return  common.handleError(err, 'Error, No category record found',res,500)   
                        } 
                        if (!categoryArry || (categoryArry && categoryArry.length ==0)){
                          database.close();              
                          return  common.handleError(err, 'No category record foundin Patient DB',res,500)   
                        }
                        for( var i in categoryArry){  
                          let category = categoryArry[i]
                          category.uploadPhotoDemographic = ''
                          category.uploadPhotoProfessional = ''                    
                          categoryList.push(category)                                
                        }
                  
                        database.close();              
                        
                        return res.json({
                          status: true,
                          message: 'category retrieval  successful.',
                          data: categoryList
                        });
                          
                  
                        });
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving category record',res,500)
        
        }      
        });
        
        
        /*
          ************
         6. fetchCategorys Count API
          ************
        */
        
        
        app.post('/api/fetchCategorysCount', function (req, res) {        
        dlog(" inside fetchCategorysCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchCategorys")
                    
                    
                    let filter = {"catValue":{$exists:true}} 
                                
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('medicine-categories').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No category record found',res,500)   
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
                        message: 'category record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving category record',res,500)
        
        }      
        });
        
        app.post('/api/fetch-all-categorys',function (req, res) {        
          dlog(" inside all-patients api  ")
        
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
           var db = database.db()     
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
             
           dlog(" Database connected successfully at all-patients")
           
           let filter = {active:true}  
        
           db.collection('medicine-categories').find(filter).toArray(function(err, patientArry) {
               
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