const spawn = require('child_process').spawn; //          
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var observableDiff = require('deep-diff').observableDiff,
applyChange        = require('deep-diff').applyChange;
var rhs = [];
var pivot = [];
var X = [];
var i = 0;
var j = 0;
var lhs = [];

setInterval(function(){
// list serial ports:
  i=0; 
  serialport.list(function (err, ports) {
     lhs = [];
    ports.forEach(function(port) {
       lhs[i] = port.comName;
       i++;       
    });    
  });
  i=0;
  pivot = rhs;
  console.log("puertos almacenbados " +rhs);
  console.log("puertos leidos " +lhs);
  var INICIAR = 'SI';
  observableDiff(rhs, lhs, function (d) {    
    console.log(d);
    if(d.kind == 'A'){
      if(d.item.rhs){
        console.log("Adicionar puerto serie");
        rhs[d.index] = d.item.rhs;
        if(INICIAR == 'SI' && rhs[d.index] != '/dev/ttyAMA0' &&  rhs[d.index] != '/dev/ttyS0'){
          console.log("Inicar sub-proceso "+rhs[d.index]);//
          spawn('node', ['/home/pi/node/server.js', rhs[d.index]]);
        }          
      }else{
        console.log("Eliminar puerto serie");
        rhs.splice([d.index],1);
      }
    }else if(d.kind == 'E'){
      INICIAR = 'NO';
      console.log(INICIAR);
      if(rhs.length >= lhs.length){        
        for(var t = 0; t < pivot.length; t++){
          if(d.rhs == pivot[t]){
            rhs[d.path[0]] = d.rhs;
            console.log("Valor existente A, editar");
          }
        }
      }else{
        rhs[d.path[0]] = d.rhs;
        console.log("Valor existente B, editar");
        if( rhs[d.index] != '/dev/ttyAMA0' &&  rhs[d.index] != '/dev/ttyS0' ){
		console.log("Inicar sub-proceso "+rhs[d.index]);//
        	spawn('node', ['/home/pi/node/server.js', rhs[d.index]]);
	}
      }
    }
  });
 },2000);
