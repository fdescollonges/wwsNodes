module.exports = function(RED) {
	function wwsTestNode(config) {
		RED.nodes.createNode(this, config);
		this.wwsApplications = RED.nodes.getNode(config.wwsApplications);

		this.on('input', function(msg) {
			console.log("In wwsTestNode");
			var appId = this.wwsApplications.appId;
			var appSecret = this.wwsApplications.appSecret;
			var jwtToken = this.wwsApplications.accessToken;
			msg.payload = "jwt :" + appId + "/" + appSecret + " Bearer {"
					+ jwtToken + "}";
			this.send(msg);
		});
	}
	RED.nodes.registerType("wwsTestNode", wwsTestNode);
};