module.exports = function(RED) {
	function wwwTestNode(config) {
    RED.nodes.createNode(this,config);
    this.wwsApplication = RED.nodes.getNode(config.wwsApplications);


    this.on('input', function(msg) {
        console.log("In wwwTestNode");
        var appId = this.wwsApplication.appId;
        var appSecret = this.wwsApplication.appSecret;
        var jwtToken = this.wwsApplication.accessToken;
        msg.payload = "jwt :"+appId+"/"+appSecret+" Bearer {"+jwtToken+"}";
        this.send(msg);
        });
	}

	RED.nodes.registerType("wwwTestNode",wwwTestNode);
};