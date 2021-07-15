

const {check, validationResult} = require('express-validator');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
const { promisify } = require("util");
const { Validator } = require('node-input-validator');
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
var ObjectId = require('mongodb').ObjectID
//var axios = require('axios');
var request = require('request');

const Str = require('@supercharge/strings')


const figureOutFilter =  (filter) => {
                
               //   if(req.body.fetchDiscountByCustomer ==true){
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
                let DiscountIdPart = ''
                for(var i in andPartArray){
                  let individualFilter = andPartArray[i]
                  if(individualFilter['createdDate'] && individualFilter['createdDate'] != 'undefined' ){
                    createDatePart = individualFilter['createdDate'] 
                    continue
                  }
                  if(individualFilter['discountId'] && individualFilter['discountId'] != 'undefined' ){
                    DiscountIdPart = individualFilter['discountId'] 
                    continue
                  }
                  console.log("individualFilter == "+JSON.stringify(individualFilter))
                  fileterArray.push(individualFilter)
                }

                if(DiscountIdPart){ 
                  fileterArray.push({_id : new ObjectId(DiscountIdPart)})
                }

                if(createDatePart){                  
                  var dateString = createDatePart.toString()
                  var dateParts = dateString.split("-");    
                  // month is 0-based, that's why we need dataParts[1] - 1
                  var newDate = new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0]);
                  const yesterday = new Date(new Date(dateParts[2], dateParts[1] - 1, ++dateParts[0],0, 0, 0))
                  yesterday.setDate(newDate.getDate())
                  const tomorrow = new Date(newDate)
                  tomorrow.setDate(newDate.getDate() + 1)  
                  fileterArray.push({ "createdDate" : {"$gte":yesterday }})                        
                  fileterArray.push({ "createdDate" : {"$lt":  tomorrow}})                        
                  //let filter = {$and : [ { "createdDate" : {"$gt":yesterday }} ,{ "createdDate" : {"$lt":  tomorrow}} ]}  
                }
                //let finalFilter = {'$and':fileterArray}

               
                  finalFilter = {'$and':fileterArray}
                }else{
                  finalFilter = {"active":{$exists:true}} 
                }
                return finalFilter
}

const createFiles =  (staticImageDir) => {

  return new Promise((resolve,reject) => {
    fs.stat(staticImageDir, function(err) {
      if (!err) {
          dlog('Directory exists, where the images will go');
          resolve('Directory exists, where the images will go')       
          //main(demographicFileName,inputCollection,whichfiles)
          
      }
      else if (err.code === 'ENOENT') {
          dlog('Directory does not exist where the images should be saved');
          reject(new Error('Directory does not exist, where the images will go'))
      }
    });
  });
}


const getCustomerDetails = async (discountArry) =>{
  let promises = []
  
  //MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
    discountArry.forEach(function(discount, index){
       
      discount.uploadedFile = ''
    promises.push( new Promise(resolve => {     

      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          var db = database.db()     
        let filter  = {_id : new ObjectId(discount.customerId)}
          db.collection('customers').findOne(filter,function(error, customer) {

           // console.log("location per doctor == "+JSON.stringify(doctor))
            if (error ) {
                database.close(); 
                resolve(discount)
                //return common.handleError(err, 'Error fetching patient record',res,500)                    
              }
            if (!customer ) {
              database.close(); 
              //return common.handleError(err, 'patient could not be found',res,500)                    
              resolve(discount)
            }    
            if (customer ){                                   
              discount.customer = customer
            }
            //locationNewArray.push(location)
            //resolve(locationNewArray)
            //resolve({location:location,patient:patient})
            resolve(discount)
        });
      })
        
      }));
    
    })
    
  return  Promise.all(promises)

}

const getCustomerDetailsForLocation = async (discountArry,res) =>{
       
  discountArry = await getCustomerDetails(discountArry)
//  appointmentArry = await geteLocationDetails(appointmentArry)

//  dlog("appointmentArry == "+JSON.stringify(appointmentArry)) 
  // database.close();                          
   return res.json({
     status: true,
     message: 'Customers retrieval successful.',
     data: discountArry
   });



}

//const fsp = require("fs/promises");
module.exports = function (app) {


  app.post('/api/addDiscount',function (req, res) {    
  //try{    
      dlog(" inside addDiscount api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)       
      }
      
      //dlog("body ="+JSON.stringify(req.body))

      
      var inputCollection = req.body
              
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                  dlog("patientDBUrl Database connected successfully at post /addDiscount")
                  
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
              
                  var db = database.db()             
        
                  
                  inputCollection.active = true
                  //collection_json.appointmentDate = newDate.toISOString()//newDate
                  inputCollection.createdDate = new Date()
                  
                  db.collection('discounts').insertOne(inputCollection , function(error, response) {
                
                    let discount =  response.ops[0]
                    
                    //dlog("NEWLY added patient == "+JSON.stringify(patient))             
                                      
                    if (error) {
                      return common.handleError(error,'DB Insert Fail...',res,500)           
                    }
        
                    
                    return res.json({
                      status: true,
                      message: 'DB Insert Success...',
                      data: discount
                    });
                });
          
          });

  
  });

  app.post('/api/fetchdiscountDetails', [
    check('discountId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside fetchdiscountDetails api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }

    let filter  = {_id : new ObjectId(req.body.discountId)}
      try{       
    

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("discountDB Database connected successfully at post /login-discount ")             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                  var db = database.db()         
        
                  db.collection('discounts').findOne(filter,function(error, discount) {
                  if (error ) {
                      database.close(); 
                      return common.handleError(err, 'Error fetching discount record',res,500)                    
                    }
                  if (!discount ) {
                    database.close(); 
                    return common.handleError(err, 'discount could not be found',res,500)                    
                  }
                  
                  discount.uploadPhotoDemographic = ''
        
                  database.close();
                  return res.json({
                    status: true,
                    message: 'fetch Success...',
                    data: discount
                  });
                    
              });
        });
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving discount record',res,500)   
      
      }       
   
    
  });
  app.post('/api/updateDiscount', [
    check('discountId').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside updateDiscount api ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var result = req.body
    
    const photoRandomString = Str.random(8)  
      dlog("photoRandomString ="+photoRandomString)

      let uploadedFileNameSuf = "DiscountManualPrescription"+photoRandomString+"_"
    
      try{
       let filter  = {_id : new ObjectId(req.body.discountId)}
      //  Discount.findById(req.body.discountId, function (err, discount) {
        

        MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
          //   assert.equal(null, err);
                dlog("discountDB Database connected successfully at post /updateProfile")
             
                            
                if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                 var db = database.db()  
                 let fields = {}

                 let fielchange={}
                
                 if(result.discount_amount)
                  fielchange.discount_amount = result.discount_amount

                  
                 if(result.value)
                 fielchange.value = result.value

                 
                 if(result.upper_value)
                  fielchange.upper_value = result.upper_value

                  
                 if(result.lower_value)
                 fielchange.lower_value = result.lower_value

                  if(req.body.discountType && req.body.discountType.trim() !=""  )
                  fielchange.discountType = req.body.discountType
     
                  
                  if(req.body.logicType && req.body.logicType.trim() !=""  )
                  fielchange.logicType = req.body.logicType
                  
                   
                  if(req.body.byPercentAmount && req.body.byPercentAmount.trim() !=""  )
                  fielchange.byPercentAmount = req.body.byPercentAmount
                  
                   
                  //if(req.body.subLogicType && req.body.subLogicType.  )
                  //fielchange.subLogicType = req.body.subLogicType

                  
                 if(req.body.subLogicType ==false){
                  fielchange.subLogicType = false
                 }
                 if(req.body.subLogicType ==true){
                  fielchange.subLogicType = true
                 }
                  
                  
                   
                  if(req.body.logicType && req.body.logicType.trim() !=""  )
                  fielchange.logicType = req.body.logicType
                  
                  
              

                 if(req.body.active ==false){
                  fielchange.active = false
                 }
                 if(req.body.active ==true){
                  fielchange.active = true
                 }
                  
                 fielchange.updatedDate = new Date()
                
                 fielchange = {$set:fielchange}    
                 
                 dlog("fielchange == "+JSON.stringify(fielchange))             
                 db.collection('discounts').findOne(filter,function(err, discountRec) {
        
                    if (err ) {
                      database.close();
                     return  common.handleError(err, 'Error, in fetching discount',res,500)   
                    }
                    
                    if (!discountRec){
                      database.close();              
                      return  common.handleError(err, ' No discount record found with the given discount ID',res,500)   
                    }

                    db.collection('discounts').findOneAndUpdate(filter,fielchange ,{returnNewDocument:true}, function(error, response) {
                      if (error) {
                        database.close(); 
                        return common.handleError(err, 'discount password could not be updated',res,500)                    
                      }
                      let discount = response.value                        
            
                      database.close();
                      return res.json({
                        status: true,
                        message: 'discount record update Success...',
                        data: discount
                      });
                      
                    });
                 
                });
               });
            

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Discount password could not be updated',res,500)   
      
      }

       
    });

    app.post('/api/fetchDiscounts', function (req, res) {        
        dlog(" inside fetchDiscounts api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchDiscounts")              
                    let filter = {"active":{$exists:true}}     
                                   
                    if(req.body.fetchDiscountByCustomer ==true){
                      filter = {"customerId":req.body.customerId}                           
                    }
                    
                    var pageno = req.body.pageNo
                    var perPage=req.body.perPage                
                    var skipNumber = (pageno-1)*perPage
                    dlog("pageno "+pageno)              
                    dlog("perPage "+perPage)              
                    dlog("skipNumber "+skipNumber)              
        
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                                      
                      db.collection('discounts').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, discountArry) {
                        let discountList = []
                        if (err ) {
                          database.close();             
                          return  common.handleError(err, 'Error, No discount record found',res,500)   
                        } 
                        if (!discountArry || (discountArry && discountArry.length ==0)){
                          database.close();              
                          return  common.handleError(err, 'No discount record foundin Patient DB',res,500)   
                        }
                       
                  
                        database.close();              
                      //  getCustomerDetailsForLocation(discountArry,res)    
            
                        
                        return res.json({
                          status: true,
                          message: 'discount retrieval  successful.',
                          data: discountArry
                        });
                          
                  
                        });
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving discount record',res,500)
        
        }      
        });
        
       
    app.post('/api/fetchDiscountsByFilters', function (req, res) {        
      dlog(" inside fetchDiscountsByFilters api  ")
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(), 'validation error.',res,999)   
      }
      
      try{     
        
        
        //  Patient.findById(req.body.patientId, function (err, patient) {
      
          console.log("req.body == "+JSON.stringify(req.body))

          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
            //   assert.equal(null, err);
                  dlog("patientDB Database connected successfully at post /fetchDiscounts")              
                                   
                 
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
                                    
                    db.collection('discounts').find(filter).limit(perPage).skip(skipNumber).sort({'createdDate':-1}).toArray(function(err, discountArry) {
                      let discountList = []
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No discount record found',res,500)   
                      } 
                      if (!discountArry || (discountArry && discountArry.length ==0)){
                        database.close();              
                        return  common.handleError(err, 'No discount record found',res,500)   
                      }
                     
                
                      database.close();              
                      getCustomerDetailsForLocation(discountArry,res)    
          
                      /*
                      return res.json({
                        status: true,
                        message: 'discount retrieval  successful.',
                        data: discountList
                      });
                        */
                
                      });
                });
      
      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'Error retrieving discount record',res,500)
      
      }      
      });
      

      app.post('/api/fetchDiscountsByFilterCount', function (req, res) {        
        dlog(" inside fetchDiscountsCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchDiscounts")
                    
                    /*
                    let filter = {"active":{$exists:true}} 
                                   
                    if(req.body.fetchDiscountByCustomer == true){
                      filter = {"customerId":req.body.customerId}                           
                    }
                    */
                   let filter = figureOutFilter(req.body.filter)
                              
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('discounts').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No discount record found',res,500)   
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
                        message: 'discount record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving discount record',res,500)
        
        }      
        });
        
        /*
          ************
         6. fetchDiscounts Count API
          ************
        */
        
        
        app.post('/api/fetchDiscountsCount', function (req, res) {        
        dlog(" inside fetchDiscountsCount api  ")
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return common.handleError(errors.array(), 'validation error.',res,999)   
        }
        
        try{     
          
          
          //  Patient.findById(req.body.patientId, function (err, patient) {
        
            MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
              //   assert.equal(null, err);
                    dlog("patientDB Database connected successfully at post /fetchDiscounts")
                    
                    
                    let filter = {"active":{$exists:true}} 
                                   
                    if(req.body.fetchDiscountByCustomer == true){
                      filter = {"customerId":req.body.customerId}                           
                    }
                                
                    if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
                     var db = database.db()  
                     db.collection('discounts').count(filter,function(err, result) {
                      
                      if (err ) {
                        database.close();             
                        return  common.handleError(err, 'Error, No discount record found',res,500)   
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
                        message: 'discount record count API  successful.',
                        data: output
                      });
                        
                
                      });   
                     
                  });
        
        }catch(error){
          //console.error(error)
          return  common.handleError(error, 'Error retrieving discount record',res,500)
        
        }      
        });
        
        app.post('/api/fetch-all-customers-autocom',[
          check('name').not().isEmpty().trim().escape()
         ],function (req, res) {        
          dlog(" inside all-customers api  ")
        
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
           var db = database.db()     
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
             
           dlog(" Database connected successfully at all-customers")
           
           let filter  =  {  name: {'$regex':req.body.name, $options: '-i' } }
           
           db.collection('customers').find(filter).toArray(function(err, customerArry) {
               
               if (err ) return  common.handleError(err, 'Error, Erro fetching customer ',res,500)   
               if (!customerArry || (customerArry && customerArry.length ==0)){
                 database.close();                  
                 return  common.handleError(err, 'No customerArry record found with the given city Or Area or address',res,500)   
               }
               database.close();                  
               return res.json({
                 status: true,
                 message: 'Patient array retrieval success...',
                 //data: doctorIdList
                 data : customerArry
                 });              
             
             });
         
          });
        
        });

        app.post('/api/fetch-all-discounts-autocom',[
          check('name').not().isEmpty().trim().escape()
         ],function (req, res) {        
          dlog(" inside all-discounts api  ")
        
          MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
           var db = database.db()     
           if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
             
           dlog(" Database connected successfully at all-discounts")
           
	         let filter  = {_id : new ObjectId(req.body.discountId)}
           
           db.collection('discounts').find(filter).toArray(function(err, discountArry) {
               
               if (err ) return  common.handleError(err, 'Error, Erro fetching discount ',res,500)   
               if (!discountArry || (discountArry && discountArry.length ==0)){
                 database.close();                  
                 return  common.handleError(err, 'No discountArry record found with the given city Or Area or address',res,500)   
               }
               database.close();                  
               return res.json({
                 status: true,
                 message: 'Patient array retrieval success...',
                 //data: doctorIdList
                 data : discountArry
                 });              
             
             });
         
          });
        
        });
        
}