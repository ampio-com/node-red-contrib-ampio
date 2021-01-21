module.exports = function(RED) {
    function ampioout(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        au = require('../generic/ampio-utils');
		node.mac = au.sanitize_mac(config.mac);
        node.ioid = au.sanitize_ioid(config.ioid);
        node.valtype = config.valtype;
        node.srvaddress = config.srvaddress;
        
        const leftPad = require('left-pad');
        node.client  = au.setup_mqtt_client(node, config)

    	au.setup_node_status_from_mqtt_client(node)

		node.client.on('connect', function () {
            node.status({fill:"green",shape:"dot",text:"connected"});
        })
			
        node.on("input", function(msg) {
            if(msg.hasOwnProperty('valtype')){
                var valtype2=msg.valtype;
            }
            else{
                var valtype2=node.valtype;
            }
            if(msg.hasOwnProperty('mac')){
                var mac2=msg.mac;
            }
            else{
                var mac2=node.mac;
            }
            if(msg.hasOwnProperty('ioid')){
                var ioid2=msg.ioid;
            }
            else{
                var ioid2=node.ioid;
            }
            if(valtype2=='r'){
                node.client.publish('ampio/to/'+mac2+'/raw',msg.payload.toString());
            }
            else if(valtype2=='s'){
                node.client.publish('ampio/to/'+mac2+'/o/'+ioid2+'/cmd',msg.payload.toString());
            }
            else if(valtype2=='rs' || valtype2=='rsdn' || valtype2=='rm' || valtype2=='f'){
                node.client.publish('ampio/to/'+mac2+'/' + valtype2 + '/'+ioid2+'/cmd',msg.payload.toString());
            }
            else if(valtype2=='ir'){
                var outMsg = '8206' + leftPad((Number(ioid2)-1).toString(16),2,'0');
                node.client.publish('ampio/to/'+mac2+'/raw',outMsg);
            }
            else{
                node.client.publish('ampio/to/'+mac2+'/'+valtype2+'/'+ioid2+'/cmd',msg.payload.toString());
            }
                
        })

        node.on('close', function() {
            // tidy up any state
            node.client.end();
        });

    }
    RED.nodes.registerType("Ampio OUT",ampioout);

	/*
    RED.httpAdmin.get('/ampio/devices/list', RED.auth.needsPermission('ampio.read'),function(req,res){
        
        var mqtt = require('mqtt');
        var ip=req.query.ip;
        var mqttcli  = mqtt.connect('mqtt://'+ip);
        
        function OnConnect(){
            return new Promise((resolve,reject) => {
                mqttcli.on('connect', function () {
                    resolve(true);
                });
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            })
        }
        function OnSubscribe(){
            return new Promise((resolve,reject) => {
            	try{
					mqttcli.subscribe('ampio/from/can/dev/list', function (err) { //topic to subscribe
						if (!err) {
							mqttcli.publish('ampio/to/can/dev/list','');
							resolve(true); 
						}
					});
				}
				catch(error){
					console.error(error);
				}
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            });
        }
        function GetMessage(){
            return new Promise((resolve,reject) => {
                mqttcli.on('message', function (topic, message) {
                    devices = JSON.parse(message);
                    resolve(devices.devices);
                });
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            });
        }
        
        Promise.all([
            OnConnect(),
            OnSubscribe(),
            GetMessage()
        ])
        .then(resp => {
            if(resp[2]==='timeout'){
                res.status(504);
                res.json("508 server timeout");
                mqttcli.end();
            }
            else{
                mqttcli.end();
                res.json(resp[2]);
            }
        });
	});
	*/
	
	/*
    RED.httpAdmin.get('/ampio/debug', RED.auth.needsPermission('ampio.read'),function(req,res){
        //narzędzie do debugowania sieci CAN. Przykład: http://IPMSERV:1880/ampio/debug?ip=IPMSERV&param=can
        //param: can lub version. can zwróci ilość pakietów i błędów, version zwróci wersję mostu.
        //w jednej z kolejnych updatów zaimplementuję to do frontendu w celu sprawdzania wersji mostu.
        
        //tool used to debug can network. Ex: http://IPMSERV:1880/ampio/debug?ip=IPMSERV&param=can
        //param: can or version. can will return qty of packets and errors in can network. Version will return version of MQTT bridge.
        var mqtt = require('mqtt');
        var ip=req.query.ip;
        var param=req.query.param;
        var mqttcli  = mqtt.connect('mqtt://'+ip);
        
        function OnConnect(){
            return new Promise((resolve,reject) => {
                mqttcli.on('connect', function () {
                    resolve(true);
                });
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            })
        }
        function OnSubscribe(){
            return new Promise((resolve,reject) => {
            	try{
					mqttcli.subscribe('ampio/from/info/'+param, function (err) { //topic to subscribe
						if (!err) {
							mqttcli.publish('ampio/to/info/' + param,' ');
							resolve(true); 
						}
					});
				}
				catch(error){
					console.error(error);
				}
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            });
        }
        function GetMessage(){
            return new Promise((resolve,reject) => {
                mqttcli.on('message', function (topic, message) {
                    resolve(message);
                });
                setTimeout(function() {
                    resolve('timeout');
                }, 2000);
            });
        }
        
        Promise.all([
            OnConnect(),
            OnSubscribe(),
            GetMessage()
        ])
        .then(resp => {
            if(resp[2]==='timeout'){
                res.status(504);
                res.json("508 server timeout");
                mqttcli.end();
            }
            else{
                mqttcli.end();
                res.json(resp[2].toString().split(/\r?\n/));
            }
        });
    });
    
    
    RED.httpAdmin.get('/ampio/devices/desc', RED.auth.needsPermission('ampio.read'),function(req,res){
    	var mqtt = require('mqtt');
		var ip=req.query.ip;
		var dmac=req.query.mac;
		var mqttcli = mqtt.connect('mqtt://'+ip);
      
      	function OnConnect(){
        	return new Promise((resolve,reject) => {
            	mqttcli.on('connect', function () {
                	resolve(true);
             	});
             	setTimeout(function() {
                	resolve('timeout');
             	}, 1000);
        	})
      	}
    	function OnSubscribe(){
    		return new Promise((resolve,reject) => {
				mqttcli.subscribe('ampio/from/'+dmac+'/description', function (err) { //topic to subscribe
					if (!err) {
						mqttcli.publish('ampio/to/'+dmac+'/description','');
						resolve(true);
					}
				});
				setTimeout(function() {
						resolve('timeout');
					}, 1000);
				});
      	}
      	function GetMessage(){
        	return new Promise((resolve,reject) => {
            	mqttcli.on('message', function (topic, message) {
                	let descriptions = JSON.parse(message);
                	resolve(descriptions);
             	});
             	setTimeout(function() {
                	resolve('timeout');
             	}, 1000);
          	});
      	}
      	
      	function btoa(data){
      		let buff = new Buffer.from(data, 'ascii');
			let text = buff.toString('base64');
			return text;
      	}
      	
      	function ListLoop(params){
      		let List=[];
      		let data=params.data;
      		let con=params.con;
      		console.log(dmac);
      		console.log(params);
      		for(i=1;i<(Number(params.lim)+1);i++){
					List[i]=" ";
			}	
			for(var prop in data){
				if(data.hasOwnProperty(prop)){
					if(con.includes(Number(prop.split('_')[0]))){
						if([11,13,15,17].includes(Number(prop.split('_')[0]))){
							List[(Number(prop.split('_')[1])+255)]=data[prop];
						}
						else{
							List[(Number(prop.split('_')[1])+1)]=data[prop];
						}
					}
				}
			}
      		return List;
      	}
      	
      	function PrepareList(data){
      		var DescList;
      		let params={};
      		params.data=data;
      		let dict={
				s: {
					lim: Math.max(req.query.bo,req.query.ao),
					con: [12,13,16,17]
				},
      			r: {
					lim: 0,
					con: []
				},
      			f: {
					lim: req.query.f,
					con: [6]
				},
      			rs: {
					lim: req.query.rt,
					con: [16,17]
				},
      			rsdn: {
					lim: req.query.rt,
					con: [16,17]
				},
      			rm: {
					lim: req.query.rt,
					con: [16,17]
				},
      			t: {
					lim: 6,
					con: [3]
				},
      			o: {
					lim: Math.max(req.query.bo,req.query.ao),
					con: [12,13,16,17]
				},
      			a: {
					lim: Math.max(req.query.ai,req.query.ao),
					con: [14,15,16,17]
				},
      			re: {
					lim: req.query.bi,
					con: [1,2,10,11]
				},
      			rgbw: {
					lim: 1,
					con: []
				},
      			i: {
					lim: req.query.bi,
					con: [1,2,10,11]
				},
      			au: {
					lim: 18,
					con: []
				},
      			au16: {
					lim: 9,
					con: []
				},
      			au32: {
					lim: 32,
					con: []
				},
				ir: {
					lim: 0,
					con: [21]
				}
      		}
      		
      		if(dict.hasOwnProperty(req.query.valtype)){
      			params.con = dict[req.query.valtype].con;
      			params.lim = dict[req.query.valtype].lim;
      		}
      		else{
      			params.con=[];
      			params.lim=0;
      		}
      		DescList=ListLoop(params);
			return DescList;
      	}
      	
      	function ErrorLoop(WarningMessage,length){
      		let List=[];
      		List[0]=WarningMessage;
      		for(i=1;i<Number(length)+1;i++){
      			List[i]=btoa("Error reading name");
      		}
      		return List;
      	}
      	
      	function ErrorList(){
      		let WarningMessage=null;
      		let List;
      		let limit;
      		
      		let bo=req.query.bo;
      		let bi=req.query.bi;
      		let ao=req.query.ao;
      		let ai=req.query.ai;
      		let f=req.query.f;
      		
      		if(bo==32 && ao==16 && bi==40 && ai==8){
				WarningMessage=btoa("Legacy mode: Update your MQTT bridge on MSERV!");
				console.log("Error loading descriptions data from MSERV. It seems, you may have MQTT Bridge older than v3.7. Go to MSERV web panel and update Ampio software.")
			}
			else if(bo==0 && ao==0 && bi==0 && ai==0){
				WarningMessage=btoa("Update MQTT Bridge on your MSERV!");
				console.log("It seems you have MQTT Bridge v3.3-3.6, which had descriptions functionality in beta version. Upgrade it by MSERV web panel.")
				bo=8;
				bi=8;
				ai=8;
				f=32;
			}
      		let LimDict={
      			s: Math.max(bo,ao),
      			r: 0,
      			f: f,
      			rs: req.query.rt,
      			rsdn: req.query.rt,
      			rm: req.query.rt,
      			t: 6,
      			o: Math.max(bo,ao),
      			a: ai,
      			re: bi,
      			rgbw: 1,
      			i: bi,
      			ir: 32,
      			au: 18,
      			au16: 9,
      			au32: 32
      		}
      		if(LimDict.hasOwnProperty(req.query.valtype)){
      			limit=LimDict[req.query.valtype];
      		}
      		else{
      			limit=0;
      		}
			
			List=ErrorLoop(WarningMessage,limit)
			return List;
      	}
      
      	Promise.all([
        	OnConnect(),
            OnSubscribe(),
            GetMessage()
        ])
      	.then(resp => {
        	if(resp[2]==='timeout'){
        		mqttcli.end();
        		let r = ErrorList();
            	res.json(r);
            }
            else{
            	mqttcli.end();
            	//res.json(resp[2]);
            	res.json(PrepareList(resp[2]));
            }
        });
	});
	*/
    
    /*
    RED.httpAdmin.get('/ampio/devices/types', RED.auth.needsPermission('ampio.read'),function(req,res){
        let DevTypes = require('./db/devtypes.json');
        res.json(DevTypes);
    });

    RED.httpAdmin.get('/ampio/invaluetypes', RED.auth.needsPermission('ampio.read'),function(req,res){
      let ValTypes = require('./db/invaltypes.json');
      //'hum', 'absp', 'relp', 'db', 'lm', 'iaq' nadawczy 1801, odbiorczy 1800
      res.json(ValTypes);
    });

    RED.httpAdmin.get('/ampio/outvaluetypes', RED.auth.needsPermission('ampio.read'),function(req,res){
        let ValTypes = require('./db/outvaltypes.json');
        res.json(ValTypes);
      });

	  */
};


