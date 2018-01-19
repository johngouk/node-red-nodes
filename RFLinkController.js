// Collect context variables
// And then do something
var inCount = context.get('inCount')||0;
var outCount = context.get('outCount')||0;
var transmitting = context.get('transmitting')||false;
var okSends = context.get('okSends')||0;
var badSends = context.get('badSends')||0;
var msgs = [];
msgs = context.get('msgs')||[];
var inMsg = null;
var outMsg = null;
// Collect messages for transmission
/*
  Incoming: 20;nn;{protocol|responseCode|name=value|initString}[;optional extra fields]
  Unsolicited:
    protocol = Depends on received message type e.g. "Drayton", "Tristate", "Eurodomest"
    initString = "Nodo RFLink..."
  Solicited:
    responseCode = {OK|CMD UNKNOWN|PONG}
    name = {VER|RFDEBUG|RFUDEBUG|QRFDEBUG}
    
  Outgoing: 10;{protocol|command}[;optional extra fields]
*/
//Determine type
var msgFields = msg.payload.split(";");
var protocol = msgFields[2].split("=")[0];
if (protocol === null) { protocol = "";}
if (msgFields[0] == "20") { // Incoming
    inCount += 1;
    msgSeq = msgFields[1];
    inMsg = msg;
    // Init msg = "20;00;Nodo RFlink etc"
    if ((msgSeq == "00")&&(msgFields[2].split(" ")[0] =="Nodo")) {
        // Link has just restarted - init all fields
        inCount = 0;
        outCount = 0;
        msgs = [];
    } else { // Either Response or Unsolicited msg
        // Response to sent message
        if (msgFields[2] == "CMD UNKNOWN") {
            // Error
            badSends += 1;
            transmitting = false;
        } else if ((msgFields[2] == "PONG")
        ||(msgFields[2] == "OK")
        ||(protocol =="VER")
        ||(protocol =="RFDEBUG")
        ||(protocol =="RFUDEBUG")
        ||(protocol =="QRFDEBUG")){
            // Accept OK, VER, PONG, xxDEBUG
            okSends += 1;
            transmitting = false;
        }
    } // Response or received data
} else // Outgoing
{
    outCount += 1;
    msgs.push(msg);
}
if ((msgs.length > 0) && (transmitting === false)) {
        outMsg = msgs.shift();
        transmitting = true;
    }
var status = "Out:" + outCount + " In:" + inCount + " OK:" + okSends + " Bad:" + badSends + " Q:" + msgs.length + " T:" + transmitting;
node.status({text:status});
var totalMsgs = {};
totalMsgs.msgs = msgs;
totalMsgs.state = status;
if (msgs.length > 10) { // Don't want buffer to be too huge when testing
//    outCount = 0;
//    inCount = 0;
    node.warn("Dumped message queue");
    msgs = [];
}
context.set('inCount',inCount);
context.set('outCount',outCount);
context.set('msgs',msgs);
context.set('transmitting', transmitting);
context.set('badSends', badSends);
context.set('okSends', okSends);
return[inMsg,outMsg,totalMsgs];
