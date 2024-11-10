const express = require('express');
const router = express.Router();
const {index,upload,StuSingUp,DellNotificantion,ConfirmLogin,
       CheckStuReg,ShowDashbord,ShowChallan,Logout,SetRegistration}= require('../controllers/StudentController');


router.get('/', index);
router.post('/stu_singup', upload.single('profileImage'),StuSingUp);
router.get('/dell_si_notif/:N_Id',DellNotificantion );  
router.post('/login/confirm', ConfirmLogin);
router.post('/stu/reg',SetRegistration);
router.get('/student_dashboard',CheckStuReg);
router.get('/student_dashboard1',ShowDashbord);
router.get('/student/logout', Logout);
router.get('/challan',ShowChallan);
module.exports = router;



// router.get('/student_dashboard', function (req, res) {
  //   const userId = req.session.userId;
  //   //console.log(userId);
  //   const selectQuery_student = 'SELECT * FROM student WHERE reg_number = ?';
  //   con.query(selectQuery_student, [userId], (err, result) => {
  //     if (err) throw err;
  //     //console.log(result);
  //     const selectQuery_si_notification = 'SELECT * FROM si_notification WHERE reg_number = ? ';
  //     const selectQuery_reg = 'SELECT * FROM s_registration WHERE reg_number = ? ';
  //     con.query(selectQuery_si_notification, [userId], (err, result1) => {
  //       if (err) throw err;
  //       //console.log(result);
  //       let chake;
  //     con.query('selectQuery_reg',[userId],(err,result6)=>{
  //       if(err) throw err;     
  //       if(result6.length > 0){
  //                chake=0;
  //             }else{
  //               chake=1;
  //             }
  //       });
  //       const ch=chake; 
  //       const currentDate = new Date();
  //       res.render("student_dashboard", { student: result[0], notification: result1 ,currentDate });
  //     });
  //   });
  
  // })
  
