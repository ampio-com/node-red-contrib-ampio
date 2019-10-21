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
