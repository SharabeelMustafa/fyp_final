const multer = require('multer');
const {ConnactMysql}= require('../connection');
const bcrypt = require('bcrypt');
const path = require('path');

let RESS3;
let RESS;
let RESS1;

const con= ConnactMysql();

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



function  index (req, res) {
    con.query('SELECT bus.*,driver.name AS driver_name ,driver.contact AS driver_con FROM bus JOIN driver ON Bus.driver_emp_id = Driver.emp_id;', function (err, result) {
      if (err) throw err;
      con.query('SELECT * FROM route', function (err, result1) {
        if (err) throw err;
        res.render('login', { driver: result, route: result1 });
      })
  
    })
}

async function StuSingUp (req, res) {
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


function DellNotificantion (req, res) {
    const n_Id = req.params.N_Id;
    //const userId = req.session.userId; // Current user's ID
    con.query('DELETE FROM si_notification WHERE sin_id = ?', [n_Id], (err) => {
      if (err) throw err;
      res.redirect('/student_dashboard');
    });
}


function ConfirmLogin(req, res){
    const { reg_number, password } = req.body;
    const selectQuery = 'SELECT * FROM student WHERE reg_number = ?';
    con.query(selectQuery, [reg_number], (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        bcrypt.compare(password, result[0].password, (err, bcryptResult) => {
          if (err) throw err;
          if (password == result[0].password) {
            const userId = result[0].reg_number;
            //console.log(userId);
            req.session.userId = userId;
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
  const selectQuery_semName = 'SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1';
  const selectQuery_reg = 'SELECT * FROM s_registration WHERE reg_number = ? AND semester_name = ?';
  
  let sem_name = null;
  RESS = 0;
 

  con.query(selectQuery_semName, function(err, result) {
      if (err) throw err;
      sem_name = result[0].semester_name;

      con.query(selectQuery_reg, [userId, sem_name], function(err, result) {
          if (err) throw err;
          if (result.length > 0) {
              RESS = 0;
          } else {
              RESS = 1;
          }

          // After the registration check, query the routes
          con.query('SELECT * FROM route', function(err, result1) {
              if (err) throw err;
              RESS1 = result1;

              // After the routes, query the stops
              con.query('SELECT * FROM stops', function(err, result3) {
                  if (err) throw err;
                  RESS3 = result3;

                  // Once all queries are done, redirect or render
                  res.redirect('/student_dashboard1');
              });
          });
      });
  });
}

function SetRegistration(req, res) {
  const { route, stop } = req.body;
  const userId = req.session.userId;
  let sem_name = null;

  const selectQuery_Busid = 'SELECT bus_id FROM `bus` WHERE route_id = ?';
  const insertQuery_Busid = `
    INSERT INTO student (reg_number, bus_id) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id);`;
  const selectQuery_semName = 'SELECT semester_name FROM semester ORDER BY created_at DESC LIMIT 1';
  const insertQuery_reg='INSERT INTO s_registration (fee_status,reg_number,semester_name,s_id) VALUES (?,?,?,?)';

  con.query(selectQuery_semName, function(err, result) {
    if (err) {
      const message = "SQL database error occurred while fetching  semester_name form semester";
      return ShowErrorPage(message, err, res);
    }else{ 
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
        }else{
              
         con.query(insertQuery_reg,['unpaid',userId,sem_name,stop],function(err){
          if (err) {
            const message = "SQL database error occurred while inserting/updating regtretion recrd record";
            return ShowErrorPage(message, err, res);
          }else{
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
    //console.log(userId);
  
    const selectQuery_student = 'SELECT * FROM student WHERE reg_number = ?';
    con.query(selectQuery_student, [userId], (err, result) => {
      if (err) throw err;
      //console.log(result);
      const selectQuery_si_notification = 'SELECT * FROM si_notification WHERE reg_number = ? ';
      con.query(selectQuery_si_notification, [userId], (err, result1) => {
        if (err) throw err;
        //console.log(result);
  
        
        const currentDate = new Date()
        console.log(RESS);
        res.render("student_dashboard", { student: result[0], notification: result1,rou:RESS1,stop:RESS3,RESS, currentDate });
      });
    });
  
}



function ShowFeePage(req, res) {
  const userId = req.session.userId;
  //console.log(userId);

  const selectQuery_student = 'SELECT * FROM student WHERE reg_number = ?';
  con.query(selectQuery_student, [userId], (err, result) => {
    if (err) throw err;
    //console.log(result);
      const currentDate = new Date()
      console.log(RESS);
      res.render("fee_page", { student: result[0], currentDate });
   
  });

}

function ShowStuEcard(req, res) {
  const userId = req.session.userId;
  //console.log(userId);

  const selectQuery_student = 'SELECT * FROM student WHERE reg_number = ?';
  con.query(selectQuery_student, [userId], (err, result) => {
    if (err) throw err;
    //console.log(result);
      const currentDate = new Date()
      console.log(RESS);
      res.render("student_e_card", { student: result[0], currentDate });
   
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

function ShowErrorPage(message,err,res){
 res.render('error',{message:message,error:err});

}

function ShowChallan(req,res){
    res.render('challan');
  
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
};