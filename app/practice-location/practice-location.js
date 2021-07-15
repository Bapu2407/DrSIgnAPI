

const {check, validationResult} = require('express-validator');
const PracticeLocation = require('../../models/practice-location');
const PracticeCategory = require('../../models/practice-category');
const Doctor = require('../../models/doctor');
const Attendant = require('../../models/attendant');
var dlog = require('debug')('dlog')
var MongoClient = require('mongodb').MongoClient;
const common = require('../../utility/common');
var mongoDB = require('../../databaseconstant');
//const fsp = require("fs/promises");
module.exports = function (app) {


  app.post('/api/practice-location-add', [
    
   check('doctorID').not().isEmpty().trim().escape(),
   check('addByID').not().isEmpty().trim(),
   check('name').not().isEmpty().trim(),
   check('area').not().isEmpty().trim(),
   check('address').not().isEmpty().trim(),
   check('nearByLocation').not().isEmpty().trim()/*,   
   check('latitude').not().isEmpty().trim(),
   check('longitude').not().isEmpty().trim()*/
],function (req, res) {        
      dlog(" inside practice-location-add api  ")

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return common.handleError(errors.array(),'Validation error.',res,999)
      }

      dlog("name ="+req.body.name)
      var inputCollection = req.body    
      var temp = new PracticeLocation(inputCollection)
        
      // insert data into database
      temp.save(function (error, location) {
        // check error
        if (error) {
          return common.handleError(error,'DB Insert Fail...',res,500)           
        }

        // Everything OK
        return res.json({
          status: true,
          message: 'Practice Location Insert Success...',
          data: location
        });
      });
  
  });
  app.post('/api/practice-category', [
    
    check('category').not().isEmpty().trim().escape(),

 ],function (req, res) {        
       dlog(" inside practice-category Add api  ")

       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog(" inside Practice  category add api ")    
        var inputCollection = req.body    
        var temp = new PracticeCategory(inputCollection)
          
        // insert data into database
        temp.save(function (error, location) {
          // check error
          if (error) {
            return common.handleError(error,'Practice Category Insert Fail...',res,500)           
          }
  
          // Everything OK
          return res.json({
            status: true,
            message: 'Practice Category Insert Success...'
            
          });
        });

  });
  app.post('/api/fetchPracticeCategory', function (req, res) {        
    dlog(" inside get fetchPracticeCategory  api  by doctorID ")

    try{       
     
      MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        //   assert.equal(null, err);
            dlog("doctorDB Database connected successfully at post /fetchPracticeCategory")
           
            var db = database.db()
   
            db.collection('practice_categories').find().toArray(function(err, practiceCategoryArry) {

              if (err || !practiceCategoryArry) {
                database.close();
                return  common.handleError(err, 'No Practice Category record found with the given doctor ID',res,200)   
              }

              database.close();
              return res.json({
                status: true,
                message: 'Practice Category retrieval success...',
                data: practiceCategoryArry
              });

            });
        });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Practice location  record',res,500)   
    
    }     
    
  });
  app.post('/api/practice-location', [
    check('doctorID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get practice-location  api  by doctorID ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
    let filter = { doctorID:  req.body.doctorID};
    try{       
      PracticeLocation.find(filter, function (err, practiceLocationArray) {
        if (err || !practiceLocationArray || (practiceLocationArray && practiceLocationArray.length ==0)) return  common.handleError(err, 'No Practice location record found with the given doctor ID',res,500)   
    
      //  res.send(practiceLocation);

        return res.json({
          status: true,
          message: 'Practice location retrieval success...',
          data: practiceLocationArray
        });


      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Practice location  record',res,500)   
    
    }     
    
  });
  app.post('/api/attendant-list', [
    check('doctorID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get   api  by doctorID ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
    let filter = { doctorID:  req.body.doctorID};
    try{       
      Attendant.find(filter, function (err, attenDantArray) {
        if (err || (attenDantArray && attenDantArray.length ==0) ) return  common.handleError(err, 'No AttenDant record found with the given doctor ID',res,500)   
        var attendantList = []
        
        for( var i in attenDantArray){

          let attendant = attenDantArray[i]
          if(!attendantList.includes(attendant['_id'])){
            attendantList.push(attendant['_id'])
          }
          
        }
    
        dlog("name ="+JSON.stringify(attenDantArray))

      //  res.send(attendantList);
        return res.json({
          status: true,
          message: 'AttenDant List retrieval success...',
          data: attendantList
        });


      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving AttenDant List  record',res,500)   
    
    }     
    
  });  

  app.post('/api/attendant-add', [    
    check('doctorID').not().isEmpty().trim().escape(),
    check('name').not().isEmpty().trim().escape(),
    check('email').not().isEmpty().trim().isEmail().normalizeEmail(),
    check('mobile').not().isEmpty().trim()
 ],function (req, res) {        
       dlog(" inside attendant-add api  ")

       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)       
       }
 
       dlog("name ="+req.body.name)
 
       var inputCollection = req.body
 
       var temp = new Attendant(inputCollection)
         
      Doctor.findById(req.body.doctorID, { lean: true },function (err, doctor) {
            if (err || !doctor) return  common.handleError(err, 'No Doctor record found with the given doctor ID',res,500)   
          
          // insert data into database
          temp.save(function (error, attendant) {
            // check error
            if (error) {
              return common.handleError(error,'DB Insert Fail...',res,500)           
            }
            
    
            // Everything OK
            return res.json({
              status: true,
              message: 'Attendant Insert Success...',
              data: attendant
            });
          });
      });
   
   });
 
  app.post('/api/attendant-list-details', [
    check('doctorID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get   api  by doctorID ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
    let filter = { doctorID:  req.body.doctorID};
    try{       
      Attendant.find(filter, function (err, attenDantArray) {
        if (err || (attenDantArray && attenDantArray.length ==0) ) return  common.handleError(err, 'No AttenDant record found with the given doctor ID',res,500)   
        

    
        dlog("name ="+JSON.stringify(attenDantArray))

      //  res.send(attendantList);
        return res.json({
          status: true,
          message: 'AttenDant List retrieval success...',
          data: attenDantArray
        });


      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving AttenDant List  record',res,500)   
    
    }     
    
  });

  app.post('/api/delete-practice-location', [
    check('locationId').not().isEmpty().trim().escape(),
    check('deletedByID').not().isEmpty().trim().escape()
   ], function (req, res) {        
    dlog(" inside get delete practice-location  api  by doctorID ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)   
    }
    
    try{       
      PracticeLocation.findById(req.body.locationId, { lean: true }, function (err, practiceLocation) {
        if (err || !practiceLocation) return  common.handleError(err, 'No Practice location record found with the given  ID',res,500)   
      
        practiceLocation.deletedByID = req.body.deletedByID
        practiceLocation.active = false
        practiceLocation.save(function (err) {
          if (err) return common.handleError(err, 'practiceLocation  could not be deleted',res,500)   
         
        //  res.send(practiceLocation);
        return res.json({
          status: true,
          message: 'Practice location become Inactive ...',
          data: practiceLocation
        });

        });
      });
    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'Error retrieving Practice location  record',res,500)   
    
    }     
    
  });
  
  //practice-location-edit API
  app.post('/api/practice-location-edit', [
    check('practiceLocationId').not().isEmpty().trim().escape(),
   ], function (req, res) {        
    dlog(" inside practice-location-edit api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    var inputCollection = req.body
  
      try{
       
        PracticeLocation.findById(req.body.practiceLocationId, function (err, practiceLocation) {
        
        if (err || !practiceLocation) return  common.handleError(err, 'No PracticeLocation record found with the given practiceLocationId',res,500)   
        
        if(req.body.practiceLocationID)
          practiceLocation.practiceLocationID = req.body.practiceLocationID
        
          if(req.body.addByID)
          practiceLocation.addByID = req.body.addByID
          if(req.body.address)
            practiceLocation.address = req.body.address
          
          if(req.body.area)
            practiceLocation.area = req.body.area
        
          if(req.body.attendantID)
            practiceLocation.attendantID = req.body.attendantID

          if(req.body.city)
            practiceLocation.city = req.body.city
            
          if(req.body.doctorID)
            practiceLocation.doctorID = req.body.doctorID            
          
          if(req.body.latitude)
            practiceLocation.latitude = req.body.latitude
          
          if(req.body.name)
            practiceLocation.name = req.body.name
        
          if(req.body.dateTime)
            practiceLocation.dateTime = req.body.dateTime
          
          if(req.body.nearByLocation)
            practiceLocation.nearByLocation = req.body.nearByLocation
            
          if(req.body.slot){
            practiceLocation.slot = inputCollection.slot
          }
          if(req.body.state){
            practiceLocation.state = inputCollection.state
          }
    
          practiceLocation.save(function (err) {
            if (err) return common.handleError(err, 'practice-location could not be updated',res,500)   
           
            return res.json({
              status: true,
              message: 'practice-location-edit Success...',
              data: practiceLocation
            });
          // res.send(practiceLocation);
          });
          
        });

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'practice-location could not be updated',res,500)         
      }

    });

    //practice-location-edit API
  app.post('/api/practice-location-byid', [
    check('practiceLocationId').not().isEmpty().trim().escape(),
   ], function (req, res) {        
    dlog(" inside practice-location-edit api  ")

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return common.handleError(errors.array(), 'validation error.',res,999)        
    }
    
  
      try{
       
        PracticeLocation.findById(req.body.practiceLocationId, function (err, practiceLocation) {
        
        if (err || !practiceLocation) return  common.handleError(err, 'No PracticeLocation record found with the given practiceLocationId',res,500)   
        
         
            return res.json({
              status: true,
              message: 'practice-location-get Success...',
              data: practiceLocation
           
          // res.send(practiceLocation);
          });
          
        });

      }catch(error){
        //console.error(error)
        return  common.handleError(error, 'practice-location could not be updated',res,500)         
      }

    });



//practice-location-edit API
app.post('/api/practice-location-repeat', [
  check('practiceLocationId').not().isEmpty().trim().escape(),
 ], function (req, res) {        
  dlog(" inside practice-location-edit api  ")

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return common.handleError(errors.array(), 'validation error.',res,999)        
  }
  var inputCollection = req.body

    try{
     
      PracticeLocation.findById(req.body.practiceLocationId, function (err, practiceLocation) {
      
      if (err || !practiceLocation) return  common.handleError(err, 'No PracticeLocation record found with the given practiceLocationId',res,500)   
      
      if(req.body.practiceLocationID)
        practiceLocation.practiceLocationID = req.body.practiceLocationID
      
        
        if(req.body.dateTime)
        practiceLocation.dateTime = req.body.dateTime
      
      if(req.body.slot){
        practiceLocation.slot = inputCollection.slot
      }
    
  
        practiceLocation.save(function (err) {
          if (err) return common.handleError(err, 'practice-location could not be updated',res,500)   
         
          return res.json({
            status: true,
            message: 'practice-location-edit Success...',
            data: practiceLocation
          });
        // res.send(practiceLocation);
        });
        
      });

    }catch(error){
      //console.error(error)
      return  common.handleError(error, 'practice-location could not be updated',res,500)         
    }

  });

}
