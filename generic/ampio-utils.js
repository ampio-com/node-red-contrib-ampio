exports.sanitize_mac = function(mac_string) {
    mac_string = mac_string.toUpperCase();
    let mac_stripped_leading_zeroes = false;
    while(mac_stripped_leading_zeroes == false){
        if(mac_string[0] == '0'){
            mac_string = mac_string.substring(1);
        } else {
            mac_stripped_leading_zeroes = true;
        }
    }
    return mac_string;
}

exports.sanitize_ioid = function(ioid_string) {
    let ioid_stripped_leading_zeroes = false;
    while(ioid_stripped_leading_zeroes == false){
        if(ioid_string[0]=='0'){
            ioid_string = ioid_string.substring(1);
        } else{
            ioid_stripped_leading_zeroes=true;
        }
    }
    return ioid_string;
}

exports.setup_mqtt_client = function(node, config) {
    const mqtt = require('mqtt');
    const client = mqtt.connect('mqtt://' + config.srvaddress);
    return client;
}

exports.setup_node_status_from_mqtt_client = function(node) {
    node.status({fill: "yellow", shape: "dot", text: "not connected"});

    node.client.on('reconnect', function () {
        node.status({fill:"yellow", shape: "dot", text: "reconnecting"});
    })

    node.client.on('error', function() {
        node.status({fill: "red", shape: "dot", text: "error"});
    })

    node.client.on('close', function() {
        node.status({fill: "red",shape: "dot", text: "connection closed"});
    })

    node.client.on('offline', function() {
        node.status({fill: "red", shape:"dot", text: "disconnected"});
    })
}

exports.hex2rgb565 = function (hexcol){
    var leftPad = require('left-pad');
	let r=hexcol.substring(0,2);
	let g=hexcol.substring(2,4);
	let b=hexcol.substring(4,6);

	r = parseInt(r,16);
	g = parseInt(g,16);
	b = parseInt(b,16);

	let r5 = r>>3;
	let g6 = g>>2;
	let b5 = b>>3;

	let rgb565 = r5<<11 | g6<<5 | b5;
	rgb565 = leftPad(rgb565.toString(16),4,'0');
	return rgb565.toUpperCase()
}
