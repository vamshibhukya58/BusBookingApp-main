const express = require('express');
const bodyParser = require('body-parser');

var favicon = require('serve-favicon');
const ejs = require('ejs');
const mysql = require('mysql');
const mysql12 = require('mysql2/promise');
const { log } = require('forever');
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json())

app.use(favicon(__dirname + '/public/images/favicon.ico'));
// Set up MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',  // e.g., 'localhost'
  user: 'root',  // e.g., 'root'
  password: 'Omsairam@3479',
  database: 'snapseats_database',
});
let search_bus_list=[];
// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});
let seats_booked;
let user_login=false,admin_login=false,user_bus_no,user_route_id;
let ticket_cnt;

app.get('/', (req, res) => {
  res.render('home');
});


app.get('/home', (req, res) => {
  res.render('home');
});



app.get('/login', (req, res) => {

if(user_login==true)
  res.redirect('user');

//console.log("user not authenticated");
res.render('login');

});

app.get('/signup', (req, res) => {

  if(user_login==true)
  res.render('user');

res.render('signup');

  
});
app.get('/admin',  (req, res) => {


if(admin_login==false)
{console.log("user not authenticated");
res.redirect('login');
}
const query='select * from route';
connection.query(query, (err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }

  //console.log(results);
  const route_cards=results;
    res.render('admin',{route_cards:route_cards});
  


  }); 

});

app.post('/add_bus',(req,res)=>{
  const src=req.body.source,
  dest=req.body.destination,
  fare=req.body.fare,
  journey_time=req.body.departureTime,
  dist=req.body.dist,
  bus_no=req.body.bus_no,
  date=req.body.date;
  const query='insert into route(src,dest,journey_date,fare,distance,journey_time,bus_no) values(?,?,?,?,?,?,?)';

connection.query(query,[src,dest,date,fare,dist,journey_time,bus_no], (err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }

  console.log("added succesfully");
  
  res.redirect('admin');
  


  }); 
})



app.get('/admin/updatebus', (req, res) => {

  if(admin_login==true)
   res.render('adminupdatebus');
else
{
  console.log("user not authenticated");
  res.redirect('login');
}


});
app.get('/admin/seatingplanbybus', (req, res) => {
let array;
  if(admin_login==true)
   res.render('seatingplanbybus',{seats:array});
else
{
  console.log("user not authenticated");
  res.redirect('login');
}


});


app.post('/user/chooseseat', (req, res) => {
  console.log((req.body.card_id.match(/\[(.*?),/))[1]);
  const bus_no=(req.body.card_id.match(/\[(.*?),/))[1],route_id_s=(req.body.card_id.match(/\,(.*?)]/))[1];
  const route_id=parseInt(route_id_s, 10);
   console.log(req.body.card_id);
    console.log((req.body.card_id.match(/\,(.*?)]/))[1]);
 
 user_bus_no=bus_no;
 user_route_id=route_id;
    let query='select seat_no from bookings where bus_no=? and route_id=?';
let res1,res2;
  connection.query(query,[bus_no,route_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
      res.end();
      return;
    }
  
    console.log("Fetched seats successfully");
    console.log(results);
   
  
  
  
  let fare;
 query='select * from route,user where route_id=? and user.email=?';
 connection.query(query,[route_id,logged_user], (error, result) => {
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }

  console.log("Fetched user details successfully");
  console.log(result);
  fare=(result[0].fare);
  

 
 
  const cost=ticket_cnt*fare;
  console.log(seats_booked);
  res.render('chooseseat',{seats:results,details:result,ticket_cnt:ticket_cnt});
  });  }); 
});




app.post('/delete',(req,res)=>{
  console.log(req.body.card_id);
  const card_id=req.body.card_id;

  const query='delete from route where route_id=?';
connection.query(query, [card_id],(err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }
});


  res.redirect('admin');
})

app.post('/user/deletebus',(req,res)=>{
  console.log(req.body.card_id);
  const card_id=req.body.card_id;
  const bus_no=  (card_id.match(/\[(.*?),/))[1],seat_no_s= (card_id.match(/\,(.*?)]/))[1];

  const query='delete from bookings where bus_no=? and seat_no=?';
connection.query(query, [bus_no,seat_no_s],(err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }
  
res.redirect('trips');
});

//   res.redirect('admin');
})

app.get('/user', (req, res) => {
  if(user_login==true)
  res.render('user',{search_bus_list:search_bus_list});
else
{
  console.log("user not authenticated");
  res.redirect('login');
}
});
app.get('/user/trips', (req, res) => {

  if(user_login==false)
  res.render('login');
  console.log("hi")
  const query='select * from bookings,route where bookings.email=? and bookings.route_id=route.route_id ';
connection.query(query, [logged_user],(err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }

  //console.log(results);
  const route_cards=results;
    res.render('userTrips',{search_bus_list:route_cards});
  


  }); 
 
});
let logged_user;
app.post('/login', (req, res) => {
    const email = req.body.email;
    logged_user=email;
    const password = req.body.password;
    console.log(email);
    console.log(password);
    const query = 'SELECT * FROM user WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).send('Internal Server Error');
        res.end();
        return;
      }
  
      if (results.length > 0) {
        // User found, login successful
        user_login=true;
        res.redirect('user');
      } 
  
    
    });
  const query2= 'SELECT * FROM admin WHERE email = ? AND password = ?';
  connection.query(query2, [email, password], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
      res.end();
      return;
    }

    if (results.length > 0) {
      // User found, login successful
     admin_login=true;
     user_login=true;
      res.redirect('admin');
    } 
    res.render('home');
  
  });
   // 

});

app.post('/logout', (req, res) => {
 user_login=false;
 admin_login=false;
 logged_user="";
  res.redirect('home');

});

app.post('/book-ticket',(req,res)=>{

  const receivedArray = req.body.array;
  seats_booked=receivedArray;
  ticket_cnt=receivedArray.length;
  console.log('Received array:', receivedArray);
  for(let i=0;i<receivedArray.length;i++)
  {
    let query = 'insert into bookings(bus_no,seat_no,route_id,email) values(?,?,?,?)';
connection.query(query, [user_bus_no, receivedArray[i], user_route_id,logged_user], (err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }

  console.log("updated seats successfully");

  });

   
  }
  
  // res.json({ message: 'Array received successfully' });
})

app.post('/search_bus',(req,res)=>{
  const src=req.body.source,dest=req.body.destination,date=req.body.departureDate;

  const query='select src,route.route_id,dest,journey_date,fare,distance,route.bus_no, route.journey_time, count(booking_id) as occupancy from route right join bookings on route.bus_no=bookings.bus_no where src=? and dest=? and journey_date=? group by src,dest,route.route_id,journey_date,fare,distance,route.bus_no,route.journey_time';



  connection.query(query,[src,dest,date], (err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }

  console.log(results);
  const search_bus_list=results;
  const occupanc=results[0].occupancy;
  let color;
  if(occupanc>=36)
    color='red';
  else if(occupanc>=24)
   color='yellow'
  else
   color='green';
    res.render('user',{search_bus_list:search_bus_list,color:color});
  


  }); 
})

app.post('/search_seat_plan', (req, res) => {
 
  console.log(req.body.bus_no);
  const query='select seat_no from bookings where bus_no=?'
  connection.query(query,[req.body.bus_no], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
      res.end();
      return;
    }
    const integerSeats = results.map(row => parseInt(row.seat_no, 10));
  res.render('seatingplanbybus',{seats:integerSeats});
  });
});

app.post('/signup', (req, res) => {
 user_login=true;
 const name=req.body.name,contact=req.body.contact,email=req.body.email,passw=req.body.password;
 const query='insert into user values(?,?,?,?)'
 connection.query(query,[email,passw,name,contact],(err,results)=>{
  if (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Internal Server Error');
    res.end();
    return;
  }
  res.render('user',{search_bus_list:search_bus_list});
 })
  //res.render('admin');

});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});