const express = require('express');
const router = express.Router();
const { index, upload, StuSingUp, DellNotificantion, ConfirmLogin, CheckStuReg, ShowDashbord, ShowChallan, Logout, getDriverInfo, getNotifications } = require('../controllers/StudentApiController');

router.get('/', index);
router.post('/stu_signup', upload.single('profileImage'), StuSingUp);
router.delete('/dell_si_notif/:N_Id', DellNotificantion);
router.post('/login/confirm', ConfirmLogin);
router.get('/student_dashboard', CheckStuReg);
router.get('/student_dashboard1', ShowDashbord);
router.post('/student/logout', Logout);
router.get('/challan', ShowChallan);
router.get('/getdriverinfo', getDriverInfo);
router.get('/getnotifications', getNotifications);

module.exports = router;
