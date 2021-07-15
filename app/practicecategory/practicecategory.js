
const {check, validationResult} = require('express-validator');

//const categoryStatus = require('../../models/-category/-category-status');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { Validator } = require('node-input-validator');
const Str = require('@supercharge/strings')
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var ObjectId = require('mongodb').ObjectID  

module.exports = function (app) {


/*
    *****************************************
    1. Patient Upload--Category
    *****************************************
*/
  app.post('/api/upload-category', [ 
    
   
    check('categoryName').not().isEmpty().trim(), 

   check('uploadPhotoCategory').not().isEmpty().trim()

],function (req, res) {        
      dlog(" inside upload--Category api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }

      dlog("PatientId ="+req.body.patientId)

      var inputCollection = req.body

      if(inputCollection.categoryDate && inputCollection.categoryDate.trim() !=""){
        inputCollection.categoryDate = common.convertStringTodate(inputCollection.categoryDate)
       }

       const photoRandomString = Str.random(8)  
       dlog("photoRandomString ="+photoRandomString)
 
 
       let uploadedFileNameSuf = "Practice_Category_"+photoRandomString+"_"
       
    //  inputCollection =  doFileProcessing(inputCollection,"both")
    
    common.doFileProcessing(inputCollection,"Practice_Category",uploadedFileNameSuf,"uploadPhotoCategory","uploadPhotoCategoryURL").then((result) => {
      inputCollection = result

     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
      //   assert.equal(null, err);
          dlog("doctorDBUrl Database connected successfully at post /-category")
          
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
      
          var db = database.db()             

          
          inputCollection.active = true
          //collection_json.appointmentDate = newDate.toISOString()//newDate
          inputCollection.createdDate = new Date()
          
          db.collection('categorys').insertOne(inputCollection , function(error, response) {
        
            let Category =  response.ops[0]
            
            //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                              
            if (error) {
              return common.handleError(error,'DB Insert Fail...',res,500)           
            }

            if(Category){
              Category.uploadPhotoCategory = ''
              Category.uploadPhotoCategoryURL = inputCollection.uploadPhotoCategoryURL              
            }
            
            return res.json({
              status: true,
              message: 'DB Insert Success...',
              data: Category
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

})

/*
    *****************************************
    1. Patient -Category-status-edit
    *****************************************
*/



   app.post('/api/category-edit', [
    check('categoryId').not().isEmpty().trim().escape(),
    check('status').not().isEmpty().trim().escape()
   
 ],function (req, res) {        
       dlog(" inside -category-status-edit api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
       var inputCollection = req.body
    
    
    
       try{
 
       //  category.findById(req.body.categoryId, function (err, category) {
      
         //  fielchange = result 
 
          const photoRandomString = Str.random(8)  
        dlog("photoRandomString ="+photoRandomString)
  
  
        let uploadedFileNameSuf = "Category_"+photoRandomString+"_"
        
     //  inputCollection =  doFileProcessing(inputCollection,"both")
     
         common.doFileProcessing(inputCollection,"_Category",uploadedFileNameSuf,"uploadPhotoCategory","uploadPhotoCategoryURL").then((result) => {
            
            inputCollection = result
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
           //   assert.equal(null, err);
                 dlog("categoryDB Database connected successfully at post /updateProfile")
              
                             
                 if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()  
                  let fields = {}
 
                  let fielchange={}
                 
                  if(result.uploadPhotoCategoryURL)
                   fielchange.uploadPhotoCategoryURL = result.uploadPhotoCategoryURL
 
                   if(result.uploadPhotoCategory)
                     fielchange.uploadPhotoCategory = result.uploadPhotoCategory 
               
           
                     let filter = {_id : new ObjectId(req.body.categoryId)}
                    
                     if(req.body.status)
                    fielchange.validated = req.body.status
           
               
 
                  if(req.body.active ==false){
                   fielchange.active = false
                  }
                  if(req.body.active ==true){
                   fielchange.active = true
                  }
                   
                  fielchange.updatedDate = new Date()
                 
                  fielchange = {$set:fielchange}    
                  
                  dlog("fielchange == "+JSON.stringify(fielchange))             
                  db.collection('categorys').findOne(filter,function(err, categoryRec) {
         
                     if (err ) {
                       database.close();
                      return  common.handleError(err, 'Error, in fetching category',res,500)   
                     }
                     
                     if (!categoryRec){
                       database.close();              
                       return  common.handleError(err, ' No category record found with the given category ID',res,500)   
                     }
 
                     db.collection('categorys').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                       if (error) {
                         database.close(); 
                         return common.handleError(err, 'category password could not be updated',res,500)                    
                       }
                       let category = response.value                        
             
                       database.close();
                       return res.json({
                         status: true,
                         message: '-categorys record update Success...',
                         data: category
                       });
                       
                     });
                  
                 });
                });
               } , (err) => {
                 let errMsg            
                 errMsg = err?err.message:""
                 return res.json({
                   status: false,
                   message: 'DB update fails...',
                   error: errMsg
                 });
               });
 
       }catch(error){
         //console.error(error)
         return  common.handleError(error, 'category password could not be updated',res,500)   
       
       }

   
   });
   app.post('/api/fetchCategoryDetails', [
    check('categoryId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchCategoryDetails api  ")

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
        
                  db.collection('categorys').findOne(filter,function(error, category) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching category record',res,500)                    
                    }
                  if (!category ) {
                    database.close(); 
                    return common.handleError(err, 'category could not be found',res,500)                    
                  }
                  
                  category.uploadPhotoCategory = ''
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'login Success...',
                    data: category
                  });
                    
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving category record',res,500)   
      
      }       
   
    
  });
  app.post('/api/fetch-all-category',function (req, res) {        
    dlog(" inside all-categorys api  ")
  
    MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
  
     var db = database.db()     
     if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
       
     dlog(" Database connected successfully at all-categorys")
     
      let filter = {active:true}  
     
     db.collection('categorys').find(filter).toArray(function(err, categoryArry) {
         
         if (err ) return  common.handleError(err, 'Error, Erro fetching category ',res,500)   
         if (!categoryArry || (categoryArry && categoryArry.length ==0)){
           database.close();                  
           return  common.handleError(err, 'No categoryArry record found with the given city Or Area or address',res,500)   
         }

         let categoryList    =[]
         for( var i in categoryArry){                 
            let category = categoryArry[i]
            category.uploadPhotoCategory = ''
  
            if(!categoryList.includes(category['_id']) && category['_id'] !=null){
              categoryList.push(category)
            }
            
          }
         database.close();                  
         return res.json({
           status: true,
           message: 'Category array retrieval success...',
           data : categoryList
           });              
       
       });
   
    });
  
  });

}
