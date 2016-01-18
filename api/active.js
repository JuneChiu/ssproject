const md5 = require('md5');

module.exports = (app) => {

	app.get('/user/active/:id', function (req, res) {

		const ref = app.db.child('user/'+ req.params.id);

		ref.once('value',  snapshot => {
			const account = snapshot.val();

			if (account && !account.active) {
				// 计算所有用户总数
				app.db.child('user').once('value', (snapshot) => {
					// 激活用户
					ref.update({
						active: true,
						password: md5(Date.now()),
						index: Object.keys(snapshot.val()).length
					}, () => {
						ref.once('value', (snapshot) => {
							app.service.mail.sendSettingMail(snapshot.val(), () => {
								res.render('index', {action: 'active-success'});
							});
						});
					});
				});
			}
			else {
				res.render('index', {action: 'active-fail'});
			}

		});
	});
}