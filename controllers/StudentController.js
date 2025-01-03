const multer = require('multer');
const { ConnactMysql } = require('../connection');
const bcrypt = require('bcrypt');
const path = require('path');
const { count } = require('console');
const { type } = require('os');
const { SendNotificationTo_Bus } = require('./AdminController');

let RESS3;
let RESS;
let RESS1;

const con = ConnactMysql();

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Specify the folder to save the uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename the file to include the current timestamp
  }
});
const upload = multer({ storage: storage });



function index(req, res) {
  con.query(
    'SELECT bus.*, driver.name AS driver_name, driver.contact AS driver_con, driver.profile_img FROM bus JOIN driver ON bus.driver_emp_id = driver.emp_id;',
    function (err, result) {
      if (err) throw err;
      con.query('SELECT * FROM route', function (err, result1) {
        if (err) throw err;
        res.render('login', { driver: result, route: result1 });
      });
    }
  );
}


async function StuSingUp(req, res) {
  const { name, reg_no, email, contact, password } = req.body;
  const profileImage = req.file.filename;

  // Hash the password before saving it
  //const hashedPassword = await bcrypt.hash(password, 10);
  const bus_id = 0;
  const sql = 'INSERT INTO student (reg_number, name, contact, email, password , bus_id , profile_img, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [reg_no, name, contact, email, password, bus_id, profileImage, 1];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/');
  });
}


function DellNotificantion(req, res) {
  const n_Id = req.params.N_Id;
  const role = req.session.role;

  const table = role === 'faculty' ? 'fi_notification' : 'si_notification';
  const idField = role === 'faculty' ? 'fin_id' : 'sin_id';
  const deleteQuery_notification = `DELETE FROM ${table} WHERE ${idField} = ?`;
  //const userId = req.session.userId; // Current user's ID
  con.query(deleteQuery_notification, [n_Id], (err) => {
    if (err) throw err;
    res.redirect('/student_dashboard');
  });
}


function ConfirmLogin(req, res) {
  const { reg_number, password, role } = req.body;
  const table = role === 'faculty' ? 'facality' : 'student';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';
  let userId;
  const selectQuery = `SELECT * FROM ${table} WHERE ${idField} = ?`;
  // const selectQuery = 'SELECT * FROM student WHERE reg_number = ?';
  con.query(selectQuery, [reg_number], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, bcryptResult) => {
        if (err) throw err;
        if (password == result[0].password) {
          if (role == "student") {

             userId = result[0].reg_number;
          } else {
            
             userId = result[0].emp_id;
          }
          //console.log(userId);
          req.session.userId = userId;
          req.session.role = role;
          res.redirect('/student_dashboard');

        } else {
          res.send('Incorrect password');
          console.log(password);
          console.log(result[0].password);
        }
      });
    } else {
      res.send('User not found');
    }
  });
}


function CheckStuReg(req, res) {
  const userId = req.session.userId;
  const role = req.session.role;
  const table = role === 'faculty' ? 'f_registration' : 's_registration';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';

  const selectQuery_semName = 'SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1';
  const selectQuery_reg = `SELECT * FROM ${table} WHERE ${idField} = ? AND semester_name = ?`;

  let sem_name = null;
  RESS = 0;


  con.query(selectQuery_semName, function (err, result) {
    if (err) throw err;
    sem_name = result[0].semester_name;

    con.query(selectQuery_reg, [userId, sem_name], function (err, result) {
      if (err) throw err;
      if (result.length > 0) {
        if (role == "student"){

          req.session.regId = result[0].s_reg_id;
        } 
        else {
          
          req.session.regId = result[0].f_reg_id;
        }
        RESS = 0;
      } else {
        RESS = 1;
      }

      // After the registration check, query the routes
      con.query('SELECT * FROM route', function (err, result1) {
        if (err) throw err;
        RESS1 = result1;

        // After the routes, query the stops
        con.query('SELECT * FROM stops', function (err, result3) {
          if (err) throw err;
          RESS3 = result3;

          // Once all queries are done, redirect or render
          res.redirect('/student_dashboard1');
        });
      });
    });
  });
}

function ShowStuEcard(req, res) {
  const userId = req.session.userId;
  const role = req.session.role;

  const table = role === 'faculty' ? 'facality' : 'student';
  const table2 = role === 'faculty' ? 'f_registration' : 's_registration';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';

  const selectQuery = `SELECT * FROM ${table} WHERE ${idField} = ?`;
  const selectQuery_semName = 'SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1';
  const selectQuery_reg = `SELECT * FROM ${table2} WHERE ${idField} = ? AND semester_name = ?`;

  con.query(selectQuery_semName, function (err, semResult) {
    if (err) throw err;
    const sem_name = semResult[0].semester_name;

    con.query(selectQuery, [userId], (err, studentResult) => {
      if (err) throw err;

      con.query(selectQuery_reg, [userId, sem_name], (err, regResult) => {
        if (err) throw err;

        let RESS1 = regResult.length > 0 ? regResult[0] : null;
        const currentDate = new Date();

        res.render("student_e_card", {
          student: studentResult[0],
          RESS1,
          currentDate
        });
      });
    });
  });
}


function ShowBusInfo(req, res) {
  const userId = req.session.userId;
  const regId = req.session.regId;
  const role = req.session.role;
  console.log(regId)

  const alertMessage = req.session.alertMessage || null; // Get and clear the alert message
  req.session.alertMessage = null;

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
  const selectQuery_allRoutes = 'SELECT * FROM route'; // New query for all routes
  const selectQuery_allstop = 'SELECT * FROM stops';

  // Fetch student info
  con.query(selectQuery, [userId], (err, studentResult) => {
    if (err) throw err;

    const busId = studentResult[0].bus_id;

    // Fetch bus info
    con.query(selectQuery_bus, [busId], (err, busResult) => {
      if (err) throw err;

      const routeId = busResult[0].route_id;
      const driverId = busResult[0].driver_emp_id;

      // Fetch route info
      con.query(selectQuery_route, [routeId], (err, routeResult) => {
        if (err) throw err;

        // Fetch all routes (if needed elsewhere)
        con.query(selectQuery_allRoutes, (err, allRoutesResult) => {
          if (err) throw err;

          // Fetch stop info
          con.query(selectQuery_stopid_reg, [regId], (err, regStopIdResult) => {
            if (err) throw err;
            const stopId = regStopIdResult[0].s_id;

            // Fetch stop name
            con.query(selectQuery_stopName, [stopId], (err, stopResult) => {
              if (err) throw err;

              // Fetch driver info
              con.query(selectQuery_driver, [driverId], (err, driverResult) => {
                if (err) throw err;

                con.query(selectQuery_allstop, (err, allstopResult) => {
                  if (err) throw err;

                  const currentDate = new Date();

                  res.render("bus_info", {
                    student: studentResult[0],
                    bus: busResult[0],
                    route: routeResult[0],
                    stop: stopResult[0],
                    driver: driverResult[0],
                    allRoutes: allRoutesResult,
                    allstop: allstopResult,
                    currentDate,
                    alertMessage, // Pass the alert message
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

function setRouteChangeApplication(req, res) {
  const {
    route,
    stop,
    newStopName,
    newrouteName,
    old_stop,
    old_route,
    oldrouteName,
    oldStopName
  } = req.body;
  const userId = req.session.userId;
  const typename = "Route Change";

  // Check if a similar application already exists
  const checkQuery = `
    SELECT COUNT(*) AS count FROM aplical_for_aprovel 
    WHERE reg_number = ? AND type = ?
  `;

  con.query(checkQuery, [userId, typename], (err, result) => {
    if (err) {
      const message = "SQL database error occurred while checking existing application.";
      return ShowErrorPage(message, err, res);
    }

    if (result[0].count > 0) {
      // Application already exists
      req.session.alertMessage = "An application for this route change already exists.";
      return res.redirect('/businfo'); // Redirect to ShowBusInfo
    }

    // If no duplicate, proceed to insert the application
    const insertQuery = `
      INSERT INTO aplical_for_aprovel 
      (reg_number, type, old_stop, new_stop, old_route, new_route, old_stop_name, new_stop_name, old_route_name, new_route_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const queryParams = [
      userId,
      typename,
      old_stop,
      stop,
      old_route,
      route,
      oldStopName,
      newStopName,
      oldrouteName,
      newrouteName
    ];

    con.query(insertQuery, queryParams, (err) => {
      if (err) {
        const message = "SQL database error occurred while inserting a record into aplical_for_aprovel.";
        return ShowErrorPage(message, err, res);
      }

      SendNotificationTo_Admin(typename, `${userId} from ${oldrouteName} to ${newrouteName}`);
      res.redirect('/businfo');
    });
  });
}

// function approteRouteChangeApplication(req, res){

// }

function SendNotificationTo_Admin(heading, note) {
  const selectQuery_a_id = "SELECT a_id FROM admin";

  // Fetch all admin IDs
  con.query(selectQuery_a_id, (err, a_idResult) => {
    if (err) {
      console.error("Error fetching admin IDs:", err);
      return;
    }

    // Loop through each admin ID and send the notification
    a_idResult.forEach((admin) => {
      const insertQuery = `
        INSERT INTO ai_notification (heading, notes, a_id) 
        VALUES (?, ?, ?)
      `;
      con.query(insertQuery, [heading, note, admin.a_id], (err) => {
        if (err) {
          console.error("Error inserting notification:", err);
        }
      });
    });
  });
}


function SetRegistration(req, res) {
  const { route, stop } = req.body;
  const userId = req.session.userId;
  const role = req.session.role;
  let sem_name = null;

  const table = role === 'faculty' ? 'facality' : 'student';
  const table2 = role === 'faculty' ? 'f_registration' : 's_registration';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';

  const selectQuery_Busid = 'SELECT bus_id FROM `bus` WHERE route_id = ?';
  const insertQuery_Busid = `INSERT INTO ${table} (${idField}, bus_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id);`;
  const selectQuery_semName = 'SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1';
  const insertQuery_reg = `INSERT INTO ${table2} (fee_status,${idField},semester_name,s_id) VALUES (?,?,?,?)`;

  con.query(selectQuery_semName, function (err, result) {
    if (err) {
      const message = "SQL database error occurred while fetching  semester_name form semester";
      return ShowErrorPage(message, err, res);
    } else {
      sem_name = result[0].semester_name;
    }
  });

  con.query(selectQuery_Busid, [route], (err, result) => {
    if (err) {
      const message = "SQL database error occurred while fetching bus_id or  NO bus is on that rout plz ask admin to add  bus on that rout";
      return ShowErrorPage(message, err, res);
    }

    if (result.length > 0) {
      const busId = result[0].bus_id;

      con.query(insertQuery_Busid, [userId, busId], (err) => {
        if (err) {
          const message = "SQL database error occurred while inserting/updating student record";
          return ShowErrorPage(message, err, res);
        } else {

          con.query(insertQuery_reg, ['unpaid', userId, sem_name, stop], function (err) {
            if (err) {
              const message = "SQL database error occurred while inserting/updating regtretion recrd record";
              return ShowErrorPage(message, err, res);
            } else {
              res.redirect('/student_dashboard');
            }
          });
        }


      });

    } else {
      const message = "No bus found with the given route_id";
      return ShowErrorPage(message, null, res);
    }
  });
}

function ShowDashbord(req, res) {
  const userId = req.session.userId;
  const role = req.session.role;
  //console.log(userId);
  const table = role === 'faculty' ? 'facality' : 'student';
  const table2 = role === 'faculty' ? 'fi_notification' : 'si_notification';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';

  const selectQuery = `SELECT * FROM ${table} WHERE ${idField} = ?`;
  const selectQuery_si_notification = `SELECT * FROM ${table2} WHERE ${idField} = ? `;

  con.query(selectQuery, [userId], (err, result) => {
    if (err) throw err;
    //console.log(result);
    con.query(selectQuery_si_notification, [userId], (err, result1) => {
      if (err) throw err;
      //console.log(result);


      const currentDate = new Date()
      //console.log(RESS);
      res.render("student_dashboard", { student: result[0], notification: result1, rou: RESS1, stop: RESS3, RESS, currentDate });
    });
  });

}
function TrackBus(req, res) {
  const userId = req.session.userId;
  //console.log(userId);
  const role= req.session.role;
   
    
  const table = role === 'faculty' ? 'facality' : 'student';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';
  const selectQuery = `SELECT * FROM ${table} WHERE ${idField} = ?`;
  con.query(selectQuery, [userId], (err, result) => {
    if (err) throw err;
    //console.log(result);
      const currentDate = new Date()
      //console.log(RESS);
      res.render("student_track_bus", { student: result[0], currentDate });
   
  });

}
function ShowFeePage(req, res) {
  const userId = req.session.userId;
  const role= req.session.role;
   
    
  const table = role === 'faculty' ? 'facality' : 'student';
  const idField = role === 'faculty' ? 'emp_id' : 'reg_number';
  const selectQuery = `SELECT * FROM ${table} WHERE ${idField} = ?`;
  con.query(selectQuery, [userId], (err, result) => {
    if (err) {
      ShowErrorPage(err, res);
    }
    else {
      //console.log(result);
      const currentDate = new Date()
      // console.log(RESS);
      res.render("fee_page", { student: result[0], currentDate });
    }
  });

}


function Logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/student_dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
}

function ShowErrorPage(err, res) {
  res.render('error', { message: err.message, error: err });

}

function ShowChallan(req, res) {
  const regNo = req.session.userId; // Dynamically get the registration number from the session

  // SQL Queries
  const queryStudent = `SELECT bus_id, name FROM student WHERE reg_number = ?`;
  const queryBusRoute = `SELECT route_id FROM bus WHERE bus_id = ?`;
  const queryRouteInfo = `SELECT route_name, fee FROM route WHERE r_id = ?`;
  const queryStopID = `SELECT s_id FROM s_registration WHERE reg_number = ?`;
  const queryStopInfo = `SELECT stop_name FROM stops WHERE s_id = ?`;
  const querySemester = `SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1`;

  // Fetch student and bus information
  con.query(queryStudent, [regNo], (err, studentResult) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      if (studentResult.length === 0) {
          return res.status(404).send('No data found for the given registration number');
      }

      const { bus_id, name } = studentResult[0];

      // Fetch route ID for the bus
      con.query(queryBusRoute, [bus_id], (err, busResult) => {
          if (err) {
              console.error(err);
              return res.status(500).send('Internal Server Error');
          }
          const route_id = busResult[0]?.route_id;

          // Fetch route information
          con.query(queryRouteInfo, [route_id], (err, routeResult) => {
              if (err) {
                  console.error(err);
                  return res.status(500).send('Internal Server Error');
              }
              const { route_name, fee } = routeResult[0];

              // Fetch stop ID for the student
              con.query(queryStopID, [regNo], (err, stopIDResult) => {
                  if (err) {
                      console.error(err);
                      return res.status(500).send('Internal Server Error');
                  }
                  const stop_id = stopIDResult[0]?.s_id;

                  // Fetch stop name
                  con.query(queryStopInfo, [stop_id], (err, stopResult) => {
                      if (err) {
                          console.error(err);
                          return res.status(500).send('Internal Server Error');
                      }
                      const stop_name = stopResult[0]?.stop_name;

                      // Fetch current semester
                      con.query(querySemester, (err, semesterResult) => {
                          if (err) {
                              console.error(err);
                              return res.status(500).send('Internal Server Error');
                          }
                          const semester_name = semesterResult[0]?.semester_name;

                          // Compile all data for rendering
                          const challanData = {
                              regNo,
                              name,
                              routeName: route_name,
                              stopName: stop_name,
                              session: semester_name,
                              fee,
                              feesBreakdown: [
                                  { description: 'Transport Fee-Students', amount: fee },
                                  { description: 'Total Fee Upto 04-12-2024', amount: fee },
                                  { description: 'Total Fee Upto 07-12-2024', amount: fee + 2000 },
                                  { description: 'Total Fee Upto 10-112-2024', amount: fee + 5000 }
                              ]
                          };

                          // Render the challan form
                          res.render('challan', { challanData });
                      });
                  });
              });
          });
      });
  });
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
  Logout,
  SetRegistration,
  ShowFeePage,
  ShowStuEcard,
  ShowBusInfo,
  TrackBus,
  setRouteChangeApplication,
};