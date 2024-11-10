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

async function StuSingUp(req, res) {
  const { name, reg_no, email, contact, password } = req.body;
  const profileImage = req.file.filename;

  // Hash the password before saving it
  // const hashedPassword = await bcrypt.hash(password, 10);
  const bus_id = 0;
  const sql = 'INSERT INTO student (reg_number, name, contact, email, password , bus_id , profile_img, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [reg_no, name, contact, email, password, bus_id, profileImage, 1];
  


  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Student signed up successfully', studentId: result.insertId });
  });
}

function DellNotificantion(req, res) {
  const n_Id = req.params.N_Id;
  con.query('DELETE FROM si_notification WHERE sin_id = ?', [n_Id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notification deleted successfully' });
  });
}

function ConfirmLogin(req, res) {
  const { reg_number, password } = req.body;
  const selectQuery = 'SELECT * FROM student WHERE reg_number = ?';
  con.query(selectQuery, [reg_number], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, bcryptResult) => {
        if (err) return res.status(500).json({ error: err.message });

        if (bcryptResult) {
          const userId = result[0].reg_number;
          req.session.userId = userId;
          res.json({ message: 'Login successful', userId });
        } else {
          res.status(401).json({ error: 'Incorrect password' });
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
  upload,
  StuSingUp,
  DellNotificantion,
  ConfirmLogin,
  CheckStuReg,
  ShowDashbord,
  ShowChallan,
  Logout
};
