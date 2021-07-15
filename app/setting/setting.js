
const {check, validationResult} = require('express-validator');
const SettingFinance = require('../../models/setting');
const common = require('../../utility/common');
var dlog = require('debug')('dlog')
var MongoClient = require('mongodb').MongoClient;
var mongoDB = require('../../databaseconstant');
module.exports = function (app) {

  app.post('/api/fees-gst-commission-add', [
    check('doctorServiceName').not().isEmpty().trim().escape(),
    check('serviceFees').not().isEmpty().trim().escape(),
    check('doctorId').not().isEmpty().trim().escape(),
    check('gst').not().isEmpty().trim(),
    check('drSignetCommmision').not().isEmpty().trim()  
 ],function (req, res) {        
       dlog(" inside doctor-fees-add api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
       var temp = new SettingFinance(inputCollection)
         
       // insert data into database
       temp.save(function (error, setting) {
         // check error
         if (error) {
           return common.handleError(error,'DB Insert Fail...',res,500)           
         }
 
         // Everything OK
         return res.json({
           status: true,
           message: 'Doctor service fees,commission and GST added Success...',
           data: setting
         });
       });
   
   });
   app.post('/api/fees-gst-commission-update', [
    check('doctorServiceId').not().isEmpty().trim().escape()
 ],function (req, res) {        
       dlog(" inside doctor-fees-update api  ")
 
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
       }
 
       dlog("name ="+req.body.name)
       var inputCollection = req.body    
       var temp = new SettingFinance(inputCollection)
         
       SettingFinance.findById(req.body.doctorServiceId,function (err, setting) {
       // insert data into database
       if (err || !setting) return  common.handleError(err, 'No setting record found with the given ID',res,500) 
       if(req.body.doctorServiceName)
        setting.doctorServiceName = req.body.doctorServiceName
       if(req.body.serviceFees)
        setting.serviceFees = req.body.serviceFees
       if(req.body.gst)
        setting.gst = req.body.gst
       if(req.body.drSignetCommmision)
        setting.drSignetCommmision = req.body.drSignetCommmision

        setting.save(function (error) {
         // check error
         if (error) {
           return common.handleError(error,'Setting Update Failed...',res,500)           
         }
 
         // Everything OK
         return res.json({
           status: true,
           message: 'Doctor service fees,commission and GST update Success...',
           data: setting
         });
       });
      });
   
   });

   app.post('/api/all-services', [    
    check('doctorId').not().isEmpty().trim().escape()
  ],function (req, res) {        
     
    dlog(" inside all-services api  ")
 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return common.handleError(errors.array(),'Validation error.',res,999)
      }
         

     MongoClient.connect(mongoDB.doctorDBUrl, function(err, database) {
        
        var db = database.db()     
        if (err ) return  common.handleError(err, 'No DB connection could be made to  DB',res,500)  
        
        dlog(" Database connected successfully at view-invoices")
      
        let  filter = { doctorId:  req.body.doctorId};
  
        db.collection('settings').find(filter).toArray().then(function(servicesArry) {
          
          if (err ) return  common.handleError(err, 'Error, Got no services in DB',res,500)   
          
          if (!servicesArry || (servicesArry && servicesArry.length ==0) ){
            database.close();         
            return  common.handleError(err, 'Got no services in DB for the given doctor',res,500)   
          }          
          
          database.close();         
          return res.json({
            status: true,
            message: 'Retrieved the list of all services',
            data: servicesArry
          });
         })
      
    
     });
 
       
   
   });

}