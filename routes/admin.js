
const express = require('express');
const router = express.Router();
const {ConfirmLogin,upload,DellNotificantion,getRouteDataById,ShowRount,ShowDashbord,
       ShowStudenAt_ASN,ShowFacalityAt_ASN,ShowBusAt_ASN,ShowRountAt_ASN,SendNotificationTo_Stu,
       SendNotificationTo_Facality,SendNotificationTo_Bus,getStuBusData,SetStuData,getFacalityBusData,
       SetFacalityData,getBusRountDriverData,SetBusData,getDriverData,SetDriverData,getRountStopDriverData,
       SetRouteData,SetStopeData,Logout,ShowInstallmentDashboard,ShowRouteChangeTable,ShowInstallmentTable,TrackBuses}= require('../controllers/AdminController')

// Middleware to check if admin is logged in

function checkAdminSession(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  next();
}
//// admin route 

router.post('/admin/login/confirm', ConfirmLogin);
router.get('/show_rount/:N_Id',getRouteDataById);
router.get('/di_dond_k_dakho',ShowRount);
router.get('/admin_dashboard', checkAdminSession, ShowDashbord );
router.get('/dell_ai_notif/:N_Id',DellNotificantion );
router.get('/admin_sn', checkAdminSession, ShowStudenAt_ASN);
router.get('/admin_sn_fc', checkAdminSession,ShowFacalityAt_ASN);
router.get('/admin_sn_bc', checkAdminSession,ShowBusAt_ASN);
router.get('/admin_sn_rc', checkAdminSession, ShowRountAt_ASN);
router.post('/send_notification_sc', checkAdminSession,SendNotificationTo_Stu );
router.post('/send_notification_fc', checkAdminSession, SendNotificationTo_Facality);
router.post('/send_notification_bc', checkAdminSession,SendNotificationTo_Bus);
router.get('/add_stu_data', checkAdminSession, getStuBusData);
router.post('/signup_stu_by_admin', checkAdminSession, upload.single('profileImage'),SetStuData );
router.get('/add_faculty_data', checkAdminSession,getFacalityBusData);
router.post('/signup_faculty_by_admin', checkAdminSession, upload.single('profileImage'), SetFacalityData);
router.get('/add_bus_data', checkAdminSession,getBusRountDriverData);
router.post('/signup_bus_by_admin', checkAdminSession, SetBusData);
router.get('/add_driver_data', checkAdminSession, getDriverData);
router.post('/signup_driver_by_admin', checkAdminSession, upload.single('profileImage'),SetDriverData );
router.get('/add_route_data', checkAdminSession,getRountStopDriverData );
router.post('/signup_route_by_admin', checkAdminSession, SetRouteData);
router.post('/signup_stops_by_admin', checkAdminSession, SetStopeData);
router.get('/admin/logout', Logout);
router.get('/admin_appli', checkAdminSession, ShowInstallmentDashboard );
router.get('/table_instll', checkAdminSession, ShowInstallmentTable );
router.get('/table_route', checkAdminSession, ShowRouteChangeTable );
router.get('/buses', checkAdminSession, TrackBuses );
module.exports = router;


// router.get('/show_rount/:N_Id', function (req, res) {
  //   const n_Id = req.params.N_Id;
    
  //    con.query('SELECT * FROM route WHERE r_id = ?',[n_Id],function(err,result){
  //        if(err) throw err;
  //        con.query('SELECT * FROM stops WHERE r_id= ?',[n_Id],function(err,result1){
  //               if(err) throw err ;
               
  //               res.render('student_singup',{rou: result , stu: result1 });
  //        });
  
  //    });
  
  // });
  




// router.post('/signup_stops_by_admin', checkAdminSession, async (req, res) => {
  
  //   console.log(req.body);
  //   // console.log(req.file);
  
  //   // return res.redirect("/add_stu_data");
  
  //   const { route_no, stop_name, pickup_time, drop_time } = req.body;
  
  
  //   //const hashedPassword = await bcrypt.hash(password, 10);
  
  
  //   const sql = 'INSERT INTO stops (stop_name, pickup_time, drop_time) VALUES (?, ?, ?, ?)';
  
  //   const stops_Array = Array.isArray(stops) ? stops : [stops];
  //   const pickup_time_Array = Array.isArray(pickup_time) ? pickup_time : [pickup_time];
  //   const drop_time_Array = Array.isArray(drop_time) ? drop_time : [drop_time];
  
  //   stopsArray.forEach(stops => {
  //     const values = [route_no, stop_name, pickup_time, drop_time];
  //     con.query(sql, values, (err) => {
  //       if (err) throw err;
  //     });
  //     res.redirect('/add_route_data');
  //   });
  
// });

// router.post('/signup_stops_by_admin', checkAdminSession, async (req, res) => {
  //   console.log(req.body);
  
  //   const route_no = req.body.route_no;
  //   const stops = [];
  
  //   // Extract stop information from req.body
  //   const stopNames = req.body['stops[0][stop_name]'];
  //   const pickupTimes = req.body['stops[0][pickup_time]'];
  //   const dropTimes = req.body['stops[0][drop_time]'];
  
  //   // Check if we have arrays for stops
  //   if (Array.isArray(stopNames) && Array.isArray(pickupTimes) && Array.isArray(dropTimes)) {
  //       for (let i = 0; i < stopNames.length; i++) {
  //           stops.push({
  //               stop_name: stopNames[i],
  //               pickup_time: pickupTimes[i],
  //               drop_time: dropTimes[i]
  //           });
  //       }
  //   } else {
  //       // Handle case when there's only one stop (the values would not be arrays)
  //       stops.push({
  //           stop_name: stopNames,
  //           pickup_time: pickupTimes,
  //           drop_time: dropTimes
  //       });
  //   }
  
  //   // Insert stops into the database
  //   stops.forEach(stop => {
  //       const { stop_name, pickup_time, drop_time } = stop;
  //       const values = [route_no, stop_name, pickup_time, drop_time];
  //       const sql = 'INSERT INTO stops (r_id, stop_name, pickup_time, drop_time) VALUES (?, ?, ?, ?)';
        
  //       con.query(sql, values, (err) => {
  //           if (err) throw err;
  //       });
  //   });
  
  //   res.redirect('/add_route_data');
  // });
  

