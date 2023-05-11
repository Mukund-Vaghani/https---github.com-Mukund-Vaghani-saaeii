exports.forgotPass = function (result, callback) {

    var template = `
		<html>
			
			<head>
				<title>Forget Password Mail</title>
	
			</head>
	
			<body>
				<p>Hello ${result[0].name},</p><br>
				<p>You recently requested to reset the password for your account. Click the button below to proceed.</p><br>
				<center><a href='http://localhost:8192/api/v1/auth/resetform/${result[0].id}' style="padding:10px;background-color:skyblue;color:white">Password Reset</a></center><br>
				<p>If you did not request a password reset, please ignore this email or reply to let us know.</p><br>
				<p>Regards,</p><br>
				<p>Meet Gondaliya(MG)</p>
			</body>
	
		</html>
		`;

    callback(template);

};