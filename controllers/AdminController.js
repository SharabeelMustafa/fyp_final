const multer = require('multer');
const { ConnactMysql } = require('../connection');
const bcrypt = require('bcrypt');
const path = require('path');
const axios = require('axios');
const { console } = require('inspector');
const { error } = require('console');

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

function ConfirmLogin(req, res) {
  const { username, password } = req.body;
  const selectQuery = 'SELECT * FROM admin WHERE username = ?';
  con.query(selectQuery, [username], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, bcryptResult) => {
        if (err) throw err;
        if (password == result[0].password) {
          req.session.isAdmin = true;

          req.session.adminId = result[0].a_id;
          console.log(result[0].a_id);
          res.redirect('/admin_dashboard');
        } else {
          res.send('Incorrect password');
        }
      });
    } else {
      res.send('Admin not found');
    }
  });
}


function getRouteDataById(req, res) {
  const n_Id = req.params.N_Id;

  con.query('SELECT * FROM route WHERE r_id = ?', [n_Id], function (err, result) {
    if (err) {
      console.error("Error fetching route data:", err);
      return res.status(500).send("Server Error");
    }
    con.query('SELECT * FROM stops WHERE r_id= ?', [n_Id], function (err, result1) {
      if (err) {
        console.error("Error fetching stops data:", err);
        return res.status(500).send("Server Error");
      }
      RESS = result;
      RESS1 = result1;
      res.redirect('/di_dond_k_dakho');

    });
  });
}

function ShowRount(req, res) {
  RESS
  RESS1
  res.render('rount_show', { rou: RESS, stu: RESS1 });
}


function ShowDashbord(req, res) {
  const ad = req.session.adminId;
  //console.log(ad);
  con.query('SELECT * FROM ai_notification WHERE a_id = ?', [ad], function (err, result1) {
    if (err) throw err;
    res.render('admin_dashboard', { notif: result1 });
  });
}

function ShowInstallmentDashboard(req, res) {
  const ad = req.session.adminId;
  console.log(ad);
  con.query('SELECT * FROM ai_notification WHERE a_id = ?', [ad], function (err, result1) {
    if (err) throw err;
    res.render('admin_application', { notif: result1 });
  });
}

function ShowRouteChangeTable(req, res) {
  const ad = req.session.adminId;
  //console.log(ad);
  const typename = "Route Change";
  con.query('SELECT * FROM aplical_for_aprovel WHERE type = ?', [typename], function (err, ApplicationResult) {
    if (err) throw err;
    console.log(ApplicationResult);
    res.render('Route_change_table', { Applications: ApplicationResult });
  });
}


function ShowInstallmentTable(req, res) {
  const ad = req.session.adminId;
  console.log(ad);
  con.query('SELECT * FROM ai_notification WHERE a_id = ?', [ad], function (err, result1) {
    if (err) throw err;
    res.render('Installment_table', { notif: result1 });
  });
}
function TrackBuses(req, res) {
  
  
  con.query('SELECT bus.bus_id, route.route_name FROM bus JOIN route ON bus.route_id = route.r_id', function (err, result1) {
    if (err) throw err;
    res.render('track_buses', { busbtn: result1 });
  });
}


function ShowStudenAt_ASN(req, res) {
  con.query('SELECT * FROM student', function (err, result) {
    if (err) throw err;
    res.render('admin_send_notfi', { dat: result });
  });
}

function ShowFacalityAt_ASN(req, res) {
  con.query('SELECT * FROM facality', function (err, result) {
    if (err) throw err;
    res.render('admin_send_notfi_fc', { dat: result });
  });

}

function ShowBusAt_ASN(req, res) {
  con.query('SELECT * FROM bus', function (err, result) {
    if (err) throw err;
    res.render('admin_send_nofti_bc', { dat: result });

  });

}

function ShowRountAt_ASN(req, res) {
  con.query('SELECT * FROM student', function (err, result) {
    if (err) throw err;
    res.render('admin_send_notfi', { dat: result });

  });

}

function SendNotificationTo_Stu(req, res) {
  const { heading, note, reg_numbers } = req.body;
  if (!heading || !note || !reg_numbers) {
    return res.send('Please fill in all fields and select at least one student.');
  }

  const regNumbersArray = Array.isArray(reg_numbers) ? reg_numbers : [reg_numbers];

  regNumbersArray.forEach(reg_number => {

    const insertQuery = 'INSERT INTO si_notification (heading, note, reg_number) VALUES (?, ?, ?)';
    con.query(insertQuery, [heading, note, reg_number], (err) => {
      if (err) throw err;
    });
  });

  res.redirect('/admin_sn');
}

function SendNotificationTo_Facality(req, res) {
  const { heading, note, emp_id } = req.body;
  if (!heading || !note || !emp_id) {
    return res.send('Please fill in all fields and select at least one student.');
  }

  const emp_idArray = Array.isArray(emp_id) ? emp_id : [emp_id];

  emp_idArray.forEach(emp_id => {

    const insertQuery = 'INSERT INTO fi_notification (heading, notes, emp_id) VALUES (?, ?, ?)';
    con.query(insertQuery, [heading, note, emp_id], (err) => {
      if (err) throw err;
    });
  });

  res.redirect('/admin_sn_fc');
}

function SendNotificationTo_Bus(req, res) {
  const { heading, note, bus_id } = req.body;
  if (!heading || !note || !bus_id) {
    return res.send('Please fill in all fields and select at least one student.');
  }

  const emp_idArray = Array.isArray(bus_id) ? bus_id : [bus_id];

  emp_idArray.forEach(bus_id => {

    const student_regNo_Query = 'SELECT reg_number FROM student WHERE bus_id = ?';
    const facality_empNo_Query = 'SELECT emp_id FROM facality WHERE bus_id = ?';

    con.query(student_regNo_Query, [bus_id], (err, result) => {
      if (err) throw err;
      //console.log(result);

      result.forEach(rn => {

        const insertQuery = 'INSERT INTO si_notification (heading, note,reg_number) VALUES (?, ?, ?)';
        con.query(insertQuery, [heading, note, rn.reg_number], (err) => {
          if (err) throw err;
        });
      })
    });

    con.query(facality_empNo_Query, [bus_id], (err, result) => {
      if (err) throw err;
      console.log(result);

      result.forEach(ei => {

        const insertQuery = 'INSERT INTO fi_notification (heading, notes,emp_id) VALUES (?, ?, ?)';
        con.query(insertQuery, [heading, note, ei.emp_id], (err) => {
          if (err) throw err;
        });
      })
    });
  });

  res.redirect('/admin_sn_bc');
}


function getStuBusData(req, res) {
  con.query('SELECT * FROM student', function (err, result) {
    if (err) throw err;

    con.query('SELECT * FROM bus', function (err, result2) {
      if (err) throw err;

      res.render('admin_student_data', { stu: result, bus: result2 });
    });

  });

}

async function SetStuData(req, res) {

  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  // Hash the password before saving it
  //const hashedPassword = await bcrypt.hash(password, 10);

  const { name, reg_no, contact, bus_id, email, password } = req.body;
  const pImage = req.file.filename;


  //const hashedPassword = await bcrypt.hash(password, 10);



  const sql = 'INSERT INTO student (reg_number, name, contact, email, password , bus_id , profile_img, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [reg_no, name, contact, email, password, bus_id, pImage, 1];


  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_stu_data');
  });

}

function EditStuData(req, res) {
  const n_Id = req.params.N_Id;
  con.query('DELETE FROM  WHERE sin_id = ?', [n_Id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notification deleted successfully' });
  });
}

function getFacalityBusData(req, res) {
  con.query('SELECT * FROM facality', function (err, result) {
    if (err) throw err;

    con.query('SELECT * FROM bus', function (err, result2) {
      if (err) throw err;

      res.render('admin_faculty_data', { stu: result, bus: result2 });
    });

  });

}

async function SetFacalityData(req, res) {

  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { name, emp_id, contact, bus_id, email, password } = req.body;
  const profileImage = req.file.filename;


  //const hashedPassword = await bcrypt.hash(password, 10);


  const sql = 'INSERT INTO facality (emp_id, name, contact, bus_id, email, password, profile_img) VALUES (?, ?, ?, ?, ?, ?, ?)';

  const values = [emp_id, name, contact, bus_id, email, password, profileImage];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_faculty_data');
  });

}

function getBusRountDriverData(req, res) {
  const sql = `SELECT bus.*,driver.name AS driver_name FROM bus JOIN driver ON Bus.driver_emp_id = Driver.emp_id;`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    con.query('SELECT * FROM route', function (err, result2) {
      if (err) throw err;

      con.query('SELECT * FROM driver', function (err, result3) {
        if (err) throw err;

        res.render('admin_bus_data', { stu: result, route: result2, driver: result3 });
      });

    });

  });

}

async function SetBusData(req, res) {

  console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { bus_id, driver_emp_id, route_id } = req.body;


  //const hashedPassword = await bcrypt.hash(password, 10);


  const sql = 'INSERT INTO bus (bus_id, driver_emp_id, route_id) VALUES (?, ?, ?)';

  const values = [bus_id, driver_emp_id, route_id];

  con.query(sql, values, (err, result) => {
    if (err) {
      // console.error('Error inserting data into the database:', err);
      // return res.status(500).send('Internal Server Error');
      throw err
    }
    res.redirect('/add_bus_data');
  });

}




function getDriverData(req, res) {
  con.query('SELECT * FROM driver', function (err, result) {
    if (err) throw err;

    res.render('admin_driver_data', { stu: result });


  });
}

async function SetDriverData(req, res) {

  console.log(req.body);
  console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { name, contact, emp_id, email, password } = req.body;
  const profileImage = req.file.filename;


  //const hashedPassword = await bcrypt.hash(password, 10);


  const sql = 'INSERT INTO driver (name, contact, emp_id, email, password, profile_img) VALUES (?, ?, ?, ?, ?, ?)';

  const values = [name, contact, emp_id, email, password, profileImage];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_driver_data');
  });

}


function getRountStopDriverData(req, res) {
  con.query('SELECT * FROM route', function (err, result) {
    if (err) throw err;
    con.query('SELECT * FROM stops', function (err, result1) {
      if (err)
        throw err;
      res.render('admin_route_data', { rou: result, stu: result1 });

    });

  });

}

function DellNotificantion(req, res) {
  const n_Id = req.params.N_Id;
  //const userId = req.session.userId; // Current user's ID
  con.query('DELETE FROM ai_notification WHERE ain_id = ?', [n_Id], (err) => {
    if (err) throw err;
    res.redirect('/admin_dashboard');
  });
}

async function SetRouteData(req, res) {

  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { route_name, route_fee } = req.body;


  //const hashedPassword = await bcrypt.hash(password, 10);


  const sql = 'INSERT INTO route (route_name, fee) VALUES (?, ?)';

  const values = [route_name, route_fee];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_route_data');
  });

}

async function SetStopeData(req, res) {
  console.log(req.body);

  const stops = [];
  const { route_no } = req.body;

  // Assuming stops are indexed starting from 0 and incrementing sequentially
  let i = 0;
  while (req.body[`stops[${i}][stop_name]`] !== undefined) {
    const stop = {
      stop_name: req.body[`stops[${i}][stop_name]`],
      pickup_time: req.body[`stops[${i}][pickup_time]`],
      drop_time: req.body[`stops[${i}][drop_time]`]
    };
    stops.push(stop);
    i++;
  }

  stops.forEach(stop => {
    const { stop_name, pickup_time, drop_time } = stop;
    const values = [route_no, stop_name, pickup_time, drop_time];
    const sql = 'INSERT INTO stops (r_id, stop_name, pickup_time, drop_time) VALUES (?, ?, ?, ?)';

    con.query(sql, values, (err) => {
      if (err) throw err;
    });
  });

  res.redirect('/add_route_data');
}

function Logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/admin_dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
}


function showOptimalRoute(req, res) {
  const { r_id, start_stop, end_stop } = req.body;
  try {
    // Fetch stops associated with the route
    con.query('SELECT * FROM stops WHERE r_id = ?', [r_id], async (err, stops) => {
      if (err) {
        console.error("Error fetching stops:", err);
        return res.status(500).send("Server Error");
      }

      // Find the start and end stops
      const start = stops.find(stop => stop.s_id === parseInt(start_stop));
      const end = stops.find(stop => stop.s_id === parseInt(end_stop));

      if (!start || !end) {
        return res.status(404).send("Start or End stop not found in the route.");
      }

      // Prepare coordinates for OSRM API
      const waypoints = stops
        .map(stop => `${stop.latitude},${stop.longitude}`)
        .join(';');

      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
      console.log(osrmUrl)
      // Call OSRM API
      const osrmResponse = await axios.get(osrmUrl);
      const route = osrmResponse.data.routes[0];

      if (!route) {
        return res.status(404).send("No route found by OSRM.");
      }

      // Render the map with the optimal route
      console.log(route);

      res.render('optimal_route', {
        routeGeoJSON: route.geometry,
        start,
        end,
        stops
      });
    });
  } catch (error) {
    console.error("Error processing route:", error);
    res.status(500).send("Internal Server Error");
  }
}


module.exports = {
  ConfirmLogin,
  upload,
  DellNotificantion,
  getRouteDataById,
  ShowRount,
  ShowDashbord,
  ShowStudenAt_ASN,
  ShowFacalityAt_ASN,
  ShowBusAt_ASN,
  ShowRountAt_ASN,
  SendNotificationTo_Stu,
  SendNotificationTo_Facality,
  SendNotificationTo_Bus,
  getStuBusData,
  SetStuData,
  getFacalityBusData,
  SetFacalityData,
  getBusRountDriverData,
  SetBusData,
  getDriverData,
  SetDriverData,
  getRountStopDriverData,
  SetRouteData,
  SetStopeData,
  Logout,
  ShowInstallmentDashboard,
  ShowInstallmentTable,
  ShowRouteChangeTable,
  TrackBuses,
  showOptimalRoute,
};