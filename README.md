# wwsNodes : Watson Work Services Nodes for NodeRed

Set of useful nodes for Watson Work Services for Node-RED

## List of nodes

### wwsApplications (Configuration Node)
This configuration node is an helper for various nodes in wwsNodes. It can be reused across multiple nodes.

Specify `AppId` and `AppSecret` of your application for Watson Workplace (as stated in https://workspace.ibm.com/developer/apps) .

It retrieves token for subsequent calls and list of spaces in which it has been added to ease node usage.

### wwsSend
**Send a message to one or all spaces**

Choose to send the incoming payload in all spaces or choose one space in the list.

Now provides an output termnial for chaining messages and capture metadata of sent messages

##### Inputs : 

- `msg.payload` : text message
- `msg.color` : color of the border
- `msg.title` : title of the message
- `msg.name` : sender of the message
- `msg.avatar` : url of the picture of the sender
- `msg.spaceId` : Id of the space to send the message to (if set, it overides the UI choices)


Send to all spaces is limited to the 200 first spaces - List of spaces is only refreshed at restart / deploy unless specified by "Auto refresh space list at runtime" option.

"Auto refresh space list at runtime" option will send the message to the new spaces in which the applications has been added after deployement (or restart of node-red). It has a performance impact but it is recommended if the application is supposed to be added / removed from Workspaces

##### Outputs :

`msg.sendResult`: Output of the send message API call.


### wwsIn
**Receive a message from Watson Work Services**
Manage the Webhook subscription and the messages reception

### wwsGraphQL
**A node to send a graphQL request to Watson Work Services**

##### Inputs :

- `msg.graphQLQuery` : GraphQL Query (if set, it overides the UI query). 
  Ex. : query getSpaceId{spaces(first:5){items{id title}}}

##### Outputs :

- `msg.graphQLResult` : Output of the GraphQL Query
- `msg.graphQLInfo` : Full response from GraphQL Query (for debug)

Other msg parts are left unchanged

Now support BETA graphQL queries (thanks to Hayato :)

## Usage
To be used with Node-RED and Watson Work Service 
Go to https://workspace.ibm.com/developer/apps for more information

## Developing
Still under development

