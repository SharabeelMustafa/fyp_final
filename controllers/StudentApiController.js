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
  const role = req.query.role;
  const table = role === 'faculty' ? 'f_registration' : 's_registration';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';

  const selectQuery_semName = 'SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1';
  const selectQuery_reg = `SELECT * FROM ${table} WHERE ${idField} = ? AND semester_name = ?`;

  con.query(selectQuery_semName, function (err, result) {
    if (err) throw err;
    sem_name = result[0].semester_name;

    con.query(selectQuery_reg, [userId, sem_name], function (err, result) {
      if (err) return res.status(500).json({ error: err.message });

      if (result.length > 0) {
        req.session.regId = result[0].s_reg_id || result[0].f_reg_id;
        bool = 0;
      } else {
        bool = 1;
      }
      con.query('SELECT * FROM route', function (err, result1) {
        if (err) throw err;

        con.query('SELECT * FROM stops', function (err, result3) {
          if (err) throw err;

          res.json({ success: bool, routes: result1, stops: result3 });
        });
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


function ShowBusInfo(req, res) {
  const userId = req.session.userId;
  const regId = req.session.regId;
  const role = req.query.role;
  console.log(userId, regId, role)

  if (!userId || !regId) {
    return res.status(400).json({ error: 'Missing user session data' });
  }


  const table = role === 'faculty' ? 'facality' : 'student';
  const table2 = role === 'faculty' ? 'f_reg_id' : 's_reg_id';
  const table3 = role === 'faculty' ? 'f_registration' : 's_registration';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';

  const selectQuery = `SELECT * FROM ${table} WHERE ${idField} = ?`;
  const selectQuery_bus = 'SELECT * FROM bus WHERE bus_id = ?';
  const selectQuery_route = 'SELECT * FROM route WHERE r_id = ?';
  const selectQuery_stopid_reg = `SELECT s_id FROM ${table3} WHERE ${table2} = ?`;
  const selectQuery_stopName = 'SELECT * FROM stops WHERE s_id = ?';
  const selectQuery_driver = 'SELECT * FROM driver WHERE emp_id = ?';

  // Fetch student info
  con.query(selectQuery, [userId], (err, studentResult) => {
    if (err) return res.status(500).json({ error: err.message });

    if (studentResult.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const busId = studentResult[0].bus_id;

    // Fetch bus info
    con.query(selectQuery_bus, [busId], (err, busResult) => {
      if (err) return res.status(500).json({ error: err.message });

      if (busResult.length === 0) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      const routeId = busResult[0].route_id;
      const driverId = busResult[0].driver_emp_id;

      // Fetch route info
      con.query(selectQuery_route, [routeId], (err, routeResult) => {
        if (err) return res.status(500).json({ error: err.message });

        if (routeResult.length === 0) {
          return res.status(404).json({ error: 'Route not found' });
        }

        // Fetch stop info
        con.query(selectQuery_stopid_reg, [regId], (err, regStopIdResult) => {
          if (err) return res.status(500).json({ error: err.message });

          if (regStopIdResult.length === 0) {
            return res.status(404).json({ error: 'Stop registration not found' });
          }

          const stopId = regStopIdResult[0].s_id;

          // Fetch stop name
          con.query(selectQuery_stopName, [stopId], (err, stopResult) => {
            if (err) return res.status(500).json({ error: err.message });

            if (stopResult.length === 0) {
              return res.status(404).json({ error: 'Stop not found' });
            }

            // Fetch driver info
            con.query(selectQuery_driver, [driverId], (err, driverResult) => {
              if (err) return res.status(500).json({ error: err.message });

              if (driverResult.length === 0) {
                return res.status(404).json({ error: 'Driver not found' });
              }

              const driverInfo = {
                name: driverResult[0].name,
                email: driverResult[0].email,
                contact: driverResult[0].contact,
                profileImage: driverResult[0].profile_img
                ? `${req.protocol}://${req.get('host')}/uploads/${driverResult[0].profile_img}`
                : null,
              };

              // Respond with JSON data
              const currentDate = new Date();
              res.json({
                route: routeResult[0],
                stop: stopResult[0],
                driver: driverInfo,
                currentDate,
              });
            });
          });
        });
      });
    });
  });
}


function ShowStuEcard(req, res) {

  const selectQuery_semName = 'SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1';

  con.query(selectQuery_semName, function (err, semResult) {
    if (err) {
      console.error('Error fetching semester:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (semResult.length === 0) {
      return res.status(404).json({ error: 'No semester found.' });
    }

    res.json({
      success: true,
      sem_name: semResult[0].semester_name
    });
  });
}

function SetRegistration(req, res) {
  const route = req.body.route;
  const stop = req.body.stop;
  const userId = req.session.userId;
  const role = req.body.rol;
  console.log(route, stop, userId, role);


  const table = role === 'faculty' ? 'facality' : 'student';
  const table2 = role === 'faculty' ? 'f_registration' : 's_registration';
  const table3 = role === 'faculty' ? 'f_reg_id' : 's_reg_id';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';
  
  const selectQuery_semName = 'SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1';
  const selectQuery_Busid = 'SELECT bus_id FROM `bus` WHERE route_id = ?';
  const updateQuery_Busid = `UPDATE ${table} SET bus_id = ? WHERE ${idField} = ?`;
  const insertQuery_reg = `INSERT INTO ${table2} (fee_status,${idField},semester_name,s_id) VALUES (?,?,?,?)`;
  const fetchQuery = `SELECT ${table3} FROM ${table2} WHERE ${idField} = ?`


  con.query(selectQuery_semName, (err, result) => {
    if (err) {
      const message = "Error fetching semester_name";
      return res.status(500).json({ message: "db error occurred" });
    }
  
    const sem_name = result[0]?.semester_name;
    console.log(sem_name)
  
    // Proceed to fetch bus_id
    con.query(selectQuery_Busid, [route], (err, result) => {
      if (err) {
        const message = "Error fetching bus_id";
        return res.status(500).json({ message: "Database error occurred" });
      }
      console.log(result)
      if (result.length > 0) {
        const busId = result[0].bus_id;
        con.query(updateQuery_Busid, [busId, userId], (err) => {
          if (err) {
            return res.status(100).json({ message: "Error updating bus_id in student record" });
          }
          console.log("done")
  
          con.query(insertQuery_reg, ['unpaid', userId, sem_name, stop], (err) => {
            if (err) {
              const message = "Error inserting registration record";
              return res.status(120).json({ messag: "s_r error occurred" });
            }
            console.log("done")

            con.query(fetchQuery, [userId], (err, result) => {
              if (err) {
                const message = "Error inserting registration record";
                return res.status(120).json({ messag: "s_r error occurred" });
              }
              console.log("done")
            
              console.log(result[0]);
              const reg_id = result[0]?.s_reg_id || result[0]?.f_reg_id;
              req.session.regId = reg_id;
    
              res.json({ success: true, newBusId: busId });
            });
          });
        });
      } else {
        const message = "No bus found for the given route_id";
        return res.status(512).json({ message: "no bus error occurred" });
      }
    });
  });  
}



module.exports = {
  index,
  getNotifications,
  upload,
  StuSingUp,
  DellNotificantion,
  ConfirmLogin,
  CheckStuReg,
  ShowDashbord,
  ShowChallan,
  ShowBusInfo,
  ShowStuEcard,
  SetRegistration,
  Logout
};
