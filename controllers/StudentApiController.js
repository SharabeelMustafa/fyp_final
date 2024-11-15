const multer = require('multer');
const { ConnactMysql } = require('../connection');
const bcrypt = require('bcrypt');
const path = require('path');

let RESS3;
let RESS;
let RESS1;

const con = ConnactMysql();

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

function index(req, res) {

 
  con.query('SELECT bus.*,driver.name AS driver_name, driver.contact AS driver_con FROM bus JOIN driver ON bus.driver_emp_id = driver.emp_id;', function (err, result) {
    if (err) return res.status(500).json({ error: err.message });

    con.query('SELECT * FROM route', function (err, result1) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ drivers: result, routes: result1 });
    });
  });
}

function getDriverInfo(req, res) {
  const busId = req.query.id;

  if (!busId) {
    return res.status(400).json({ error: "bus ID is required" });
  }

  con.query('SELECT * FROM bus WHERE bus_id = ?', [busId], function (err, busResult) {
    if (err) return res.status(500).json({ error: err.message });
    if (busResult.length === 0) {
      return res.status(404).json({ error: "Bus not found" });
    }

    const routeId = busResult[0].route_id;
    con.query('SELECT * FROM route WHERE r_id = ?', [routeId], function (err, routeResult) {
      if (err) return res.status(500).json({ error: err.message });
      if (routeResult.length === 0) {
        return res.status(404).json({ error: "Route not found" });
      }

      const driverEmpId = busResult[0].driver_emp_id;
      con.query('SELECT * FROM driver WHERE emp_id = ?', [driverEmpId], function (err, driverResult) {
        if (err) return res.status(500).json({ error: err.message });
        if (driverResult.length === 0) {
          return res.status(404).json({ error: "Driver not found" });
        }

        res.json({ driver: driverResult[0], route: routeResult[0] });
      });
    });
  });
}


function getNotifications(req, res) {
  const userId = req.query.id;
  const role = req.query.role;

  if (!role || !['student', 'faculty'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  const tableName = role === 'faculty' ? 'fi_notification' : 'si_notification';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';
  const selectQuery_notification = `SELECT * FROM ${tableName} WHERE ${idField} = ?`;

  con.query(selectQuery_notification, [userId], (err, result1) => {
    if (err) return res.status(500).json({ error: err.message });

    const currentDate = new Date();
    res.json({
      notification: result1,
      currentDate
    });
  });
}



async function StuSingUp(req, res) {
  const { name, reg_no, email, contact, password } = req.body;
  const profileImage = req.file.filename;
  const bus_id = 0;
  const sql = 'INSERT INTO student (reg_number, name, contact, email, password , bus_id , profile_img, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [reg_no, name, contact, email, password, bus_id, profileImage, 1];
  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(201).json({ success: true, message: 'Student signed up successfully', studentId: result.insertId });
  });
}

function DellNotificantion(req, res) {
  const n_Id = req.params.N_Id;
  const role = req.query.role;

  if (!role || !['student', 'faculty'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  const tableName = role === 'faculty' ? 'fi_notification' : 'si_notification';
  const idField = role === 'faculty' ? 'fin_id' : 'sin_id';
  const selectQuery_notification = `DELETE FROM ${tableName} WHERE ${idField} = ?`;

  con.query(selectQuery_notification, [n_Id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notification deleted successfully' });
  });
}

function ConfirmLogin(req, res) {
  const { reg_number, password, role } = req.body;

  const table = role === 'faculty' ? 'facality' : 'student';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';

  const selectQuery = `SELECT * FROM ${table} WHERE ${idField} = ?`;

  con.query(selectQuery, [reg_number], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (bcryptErr, bcryptResult) => {
        if (bcryptErr) return res.status(500).json({ error: bcryptErr.message });

        if (result.length > 0)  {
          if (password == result[0].password) {
            const userInfo = {
              name: result[0].name,
              email: result[0].email,
              contact: result[0].contact,
              busId: result[0].bus_id,
              profileImage: result[0].profile_img
              ? `${req.protocol}://${req.get('host')}/uploads/${result[0].profile_img}`
              : null,
            };
            if (role === 'student') {
              userInfo.reg_number = result[0].reg_number;
            } else if (role === 'faculty') {
              userInfo.emp_id = result[0].emp_id;
            }

            req.session.userId = role === 'student' ? result[0].reg_number : result[0].emp_id;
            res.json({ success: true, message: 'Login successful', user: userInfo });
          } 
         else {
          res.status(401).json({ error: 'Incorrect password' });
        }
       }
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
}

function CheckStuReg(req, res) {
  const userId = req.session.userId;
  const selectQuery_reg = 'SELECT * FROM s_registration WHERE reg_number = ?';
  RESS = 0;

  con.query(selectQuery_reg, [userId], function (err, result) {
    if (err) return res.status(500).json({ error: err.message });

    RESS = result.length > 0 ? 0 : 1;

    con.query('SELECT * FROM route', function (err, result1) {
      if (err) return res.status(500).json({ error: err.message });

      RESS1 = result1;

      con.query('SELECT * FROM stops', function (err, result1) {
        if (err) return res.status(500).json({ error: err.message });

        RESS3 = result1;
        res.json({ RESS, RESS1, RESS3 });
      });
    });
  });
}

function ShowDashbord(req, res) {
  const userId = req.session.userId;

  const selectQuery_student = 'SELECT * FROM student WHERE reg_number = ?';
  con.query(selectQuery_student, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const selectQuery_si_notification = 'SELECT * FROM si_notification WHERE reg_number = ?';
    con.query(selectQuery_si_notification, [userId], (err, result1) => {
      if (err) return res.status(500).json({ error: err.message });

      const currentDate = new Date();
      res.json({
        student: result[0],
        notification: result1,
        rou: RESS1,
        stop: RESS3,
        RESS,
        currentDate
      });
    });
  });
}

function Logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
}

function ShowChallan(req, res) {
  res.json({ message: 'Show challan' });
}

module.exports = {
  index,
  getDriverInfo,
  getNotifications,
  upload,
  StuSingUp,
  DellNotificantion,
  ConfirmLogin,
  CheckStuReg,
  ShowDashbord,
  ShowChallan,
  Logout
};
