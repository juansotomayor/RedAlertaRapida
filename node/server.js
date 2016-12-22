var name = process.argv[2];
var SerialPort = require("serialport").SerialPort;
//var serialport = new SerialPort(name);
var mysql      = require('mysql');
var host  = 'localhost';  //RPI
var user = 'root';
var password = 'nosewn';
var database = 'acelerograma';
var email = 0;
var receivedData = "";
var DataString = "";

var connectArd = function() {
  var arduinoSerial = new SerialPort(name);
  arduinoSerial.on('open', function(){
    console.log('Serial Port Opend');
  });
  arduinoSerial.on('data', function(data){  
    receivedData += data.toString();
    //console.log(receivedData);
    if (receivedData.indexOf('(') == 0 && receivedData.indexOf(')') >= 10) {
        // save the data between '(' and ')'
        DataString = receivedData.substring(receivedData.indexOf('(') + 1, receivedData.indexOf(')'));       
        Data = DataString.split("*");
        console.log(receivedData+' espacio '+DataString);
        receivedData = '';
        broadcastData(Data);  
        var pivotX =  parseFloat(Data[0]) + offsetX;
        var pivotY = parseFloat(Data[1]) + offsetY;
        var pivotZ = parseFloat(Data[2]) - offsetZ;
        if(pivotX >= (pivotX+0.01) || pivotX <= (pivotX-0.01) ||
            pivotY >= (pivotY+0.01) || pivotY <= (pivotY-0.01) ||
            pivotZ >= (pivotZ+0.01) || pivotZ <= (pivotZ-0.01) ){
              Insert_Data(pivotX, pivotY, pivotZ, Data[3]);
        }  
    }else if (receivedData.indexOf(')') > 0) {
        // save the data between '(' and ')'
        console.log('Depurar');
        receivedData = ''; 
    }  
  });

  arduinoSerial.on('close', function(){
    console.log('ARDUINO PORT CLOSED');
    reconnectArd();
  });

  arduinoSerial.on('error', function (err) {
    console.error("error", err);
    reconnectArd();
  });

}

connectArd();
// check for connection errors or drops and reconnect
var reconnectArd = function () {
  console.log('INITIATING RECONNECT');
  setTimeout(function(){
    console.log('RECONNECTING TO ARDUINO');
    connectArd();
  }, 2000);
};

var offsetX = 0.09;
var offsetY = 0.045;
var offsetZ = 0.59; 

var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
	fs = require('fs'),
  sys = require('util'),
  exec = require('child_process').exec,
  child;
//Escuchamos en el puerto 8000
app.listen(8000);
//Si todo va bien al abrir el navegador, cargaremos el archivo index.html
function handler(req, res) {
	fs.readFile('/var/www/html/index.html', function(err, data) {
		if (err) {
      //Si hay error, mandaremos un mensaje de error 500
			console.log(err);
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}

//Cuando abramos el navegador estableceremos una conexión con socket.io.
//Cada 5 segundos mandaremos a la gráfica un nuevo valor. 
io.sockets.on('connection', function(socket) {
  var socketId = socket.id;
  var clientIp = socket.request.connection.remoteAddress;

  console.log('Cliente ip '+clientIp);
  console.log('connection :', socket.request.connection._peername);
});
function roundTo2Decimals(numberToRound) {
  return Math.round(numberToRound * 100) / 100
}

function broadcastData(Data){
	  var date = new Date().getTime();
    var x = parseFloat(Data[0]) + offsetX;
    var y = parseFloat(Data[1]) + offsetY;
    var z = parseFloat(Data[2]) - offsetZ;
    x = roundTo2Decimals(x);
    y = roundTo2Decimals(y);
    z = roundTo2Decimals(z);
    io.sockets.emit('ejex', date, x); 
    io.sockets.emit('ejey', date, y); 
    io.sockets.emit('ejez', date, z);
}
function Insert_Data(X, Y, Z, MODULO) {
    console.log("Insert Data");
    var connection = mysql.createConnection({
      host : host,
      user: user,
      password: password,
      database : database
    });
    connection.connect();
    var post  = {x: X, y: Y, z:Z, modulo:MODULO};
    var query = connection.query('INSERT INTO modulos SET ?', post, function(error, result) {
    if (error) {
        //console.log(error.message);
    } else {
        //console.log('success');
    }
    });
    //console.log(query.sql); // INSERT INTO posts SET `id` = 1, `title` = 'Hello MySQL'
    connection.end();
}