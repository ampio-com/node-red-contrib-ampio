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
0.2.3 - corrected bug - outputs not working<br>
0.2.2 - corrected the bug - MRT heating/cooling functions were not working, now it's OK; added IR codes sending from MSENS module; updated help files with latest functionalities<br>
0.2.1 - added au8, au16, au32 values for MCON devices. Moved values descriptions to external database. Modified and updated help files. Created readme file and updated package.json to fit node-red requirements.<br>
0.2.0 - general update, adding auto discovery for modules and auto-discovery for functions of modules
