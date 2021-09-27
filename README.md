## Ampio Node-RED module
Ampio add-on made to use Ampio Smart Home devices in Node-RED.

## Pre-requisites
You need Ampio Smart Home system, because this module is meant only to integrate it with another node-red plugins.
You also need MSERV with latest firmware, or Ampio Smart Home server installed in docker and connected through special serial-CAN adapter with Docker host device. 

## Install
This node should be pre-installed on your MSERV. In case of having software in Docker, use MENU -> Manage Palette -> Install and type ampio. Another way is to use Terminal, and installing this add-on in your ~/.node-red directory.]

## Using this add-on
After having this module installed, you will see helpful instructions in Help sections.
Basically, after installing you will have 4 add-ons:
- Ampio IN, node meant to receive informations from modules, such like: states of inputs, outputs, flags, temperatures from sensors, states of analog inputs/outputs, and 8,16,32-bit measurements. Values will be delivered immediately, after they will change, they are not sent periodically.
- Ampio OUT, meant to control outputs and flagfs ion Ampio system. You can also change temperature controller desired temperatures.
- Ampio LCD, a complete tool to display text and shapes on LCD screen on MDOT touch panels.
- Ampio Events, to send and/or receive events from your CAN Network. 

## Changelog
Disclaimer: every version lower than 1.0.0 is considered as beta. I do all my best to make every release as stable as possible, but due to fast development of protocol, API changes may occur. 1.0.0 is planned after transition to /b/ MQTT broadcasts, which requires many changes. 

### 0.4.x
0.4.5 - fixed LCD node.<br>
0.4.4 - fixed an issue, when user opened node parameters, deviced list was being generated 3 times, which sometimes resulted in tripled outputs list. Removed faulty "update MQTT" warnings.<br>
0.4.3 - fixed lack of support of linear flags in devices with protocol >= 22. <br>
0.4.2 - bugfix - unknown device type was crashing device list. Now this bug is handled. <br>
0.4.1 - bugfix, outputs were not visible for MIN-11p <br>
0.4.0 - general update, modified backend to create only one, shared client for every MQTT broker, added config node, which gives possibility to store configurations of many brokers, updated list of device types. **Manual configuration update is required after update - you will need to go add broker configuration and select it in ever Ampio Node.** <br>


### 0.3.x
0.3.0 - Added functionality of loading input/output descriptions from modules.**Requires MQTT bridge in version 3.14 or later to support this functionality**; corrected encoding in module names<br>

### 0.2.x
0.2.5 - corrected big font bug<br>
0.2.4 - corrected bug with flags<br>
0.2.3 - corrected bug - outputs not working<br>
0.2.2 - corrected the bug - MRT heating/cooling functions were not working, now it's OK; added IR codes sending from MSENS module; updated help files with latest functionalities<br>
0.2.1 - added au8, au16, au32 values for MCON devices. Moved values descriptions to external database. Modified and updated help files. Created readme file and updated package.json to fit node-red requirements.<br>
0.2.0 - general update, adding auto discovery for modules and auto-discovery for functions of modules
