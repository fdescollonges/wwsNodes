# wwsNodes - Waton Work Services Nodes for NodeRed

Set of useful nodes for Watson Work Services for Node-RED

### List of nodes

#### wwsApplications (Configuration Node)
Specify AppId and AppSecret of your application for Watson Workplace (from https://workspace.ibm.com/developer/apps) and it will retrieve token for subsequent calls and spaces in which it has been added.
This configuration node can be reused across multiple WWS nodes

#### wwsSend
Send a message to one or all spaces
Choose to send the incoming payload in all spaces or choose one space in the list
It uses : 
- msg.payload : text message
- msg.color : color of the border
- msg.title : title of the message
- msg.name : sender of the message
- msg.avatar : url of the picture of the sender
- msg.spaceId : Id of the space to send the message to (if set, it overides the UI choices)

#### wwsIn
Receive a message from Watson Work Services
Manage the Webhook subscription and the messages reception
 
### Usage
To be used with Node-RED

### Developing
Under development

