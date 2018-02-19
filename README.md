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
 
 
Send to all spaces is limited to the 200 first spaces - List of spaces is only refreshed at restart / deploy unless specified by "Auto refresh space list at runtime" option.
 
"Auto refresh space list at runtime" option will send the message to the new spaces in which the applications has been added after deployement (or restart of node-red). It has a performance impact but it is recommended if the application is supposed to be added / removed from Workspaces


#### wwsIn
Receive a message from Watson Work Services
Manage the Webhook subscription and the messages reception

#### wwsGraphQL
A node to send a graphQL request to Watson Work Services<
It uses : 
    - msg.graphQLQuery : GraphQL Query (if set, it overides the UI query). Ex. : query getSpaceId{spaces(first:5){items{id title}}}
    - msg.graphQLResult : Result of the GraphQL Query
Other msg parts are left unchanged
 
### Usage
To be used with Node-RED

### Developing
Under development

