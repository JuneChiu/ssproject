const md5 = require('md5');

module.exports = (app) => {

	const ref = app.db;

	app.post('/api/post/signup', function (req, res) {

		const key = 'user/' + md5(req.body.account);
		const userCollection = ref.child(key);

		console.log('Checking to email address');
		userCollection.once('value', snapshot => {
			const account = snapshot.val();
			console.log(account);
			if (account) {
				// 帐号如果已经被激活，则重新发送配置邮件
				if (account.active) {
					app.service.mail.sendSettingMail(account, (err, response) => {
						if (err) {
							console.log(err);
						}
						else {
							res.send({
								code: 0,
								active: account.active,
								msg: '帐号信息已经发送到 - ' + account.name
							});
						}
					});
				}
				else {
					// 如果已经存在帐号但是未激活，则发送激活连接到邮箱
					console.log('Sending active mail to ' + account.name);

					app.service.mail.sendActiveMail(account.name, account.password, (err, response) => {
						if (err) {
							console.log(err);
						}
						else {
							res.send({
								code: 0,
								active: account.active,
								msg: '激活邮件已经发送到 - ' + account.name
							});

							console.log('Have sent to ' + account.name);
						}
					});
				}

			}
			else {
				userCollection.set({
					name: req.body.account,
					password: md5(Date.now()),
					active: false,
					index: -1
				}, function(){

					// 发送激活连接到邮箱
					app.service.mail.sendActiveMail(req.body.account, key, (err, response) => {
						if (err) {
							console.log(err);
						} else {
							res.send({
								code: 0,
								active: false,
								msg: '激活邮件已经发送到 - ' + req.body.account
							});
						}
					});
				});
			}
		});
	});
}