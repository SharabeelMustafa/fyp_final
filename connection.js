//conation 
const mysql = require('mysql');
const { clear } = require('console');

 
function  ConnactMysql(){
    const con =  mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'fyp1'
      })

      con.connect(function (err) {
        if (err) throw err;
        console.log('connected');
      })
    
    
    return con;
}

module.exports = {
    ConnactMysql,
};





