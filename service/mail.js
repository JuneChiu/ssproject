const md5 = require('md5'),
	QRCode = require('qrcode'),
	base64 = require('js-base64').Base64,
	fs = require('fs'),
	exec = require('child_process').exec,
	nodemailer = require('nodemailer'),
	smtpTransport = require('nodemailer-smtp-transport');

// 设置邮件收发服务
const nodemailerMailServer = nodemailer.createTransport(smtpTransport({
	host: 'smtp.163.com',
	secure: true,
	port: 465,
	auth: {
		user: 'june.chiu@163.com',
		pass: 'Xlqxlq163163'
	}
}));

const shadowsocksSetting = require('../shadowsocks-setting.json');

module.exports = (app) => {
	const output = {};

	output.sendActiveMail = (address, callback) => {
		const option = {
			from: 'June Chiu <june.chiu@163.com>',
			to: address,
			subject: '科学上网帐号激活',
			html: `<a href="http://ss.junechiu.com/user/active/${md5(address)}">点击传送门，激活你的帐号</a>`
		};

		nodemailerMailServer.sendMail(option, callback);
	};

	output.sendSettingMail = (account, callback) => {

		// 先查出所有已经激活的用户，用于重新生成多用户配置文件
		console.log('Query all users starting');

		app.db.child('user').orderByChild('active').equalTo(true).once('value', function(snapshot) {

			console.log('Query all users finish');
			const users = snapshot.val(),
				allAccount = {},
				basePort = 30000; // 服务起始端口

			// 重新输出每个用户端口密码配对
			Object.keys(users).forEach(item => {
				allAccount[(users[item].index - 0) + basePort] = users[item].password;
			});

			const currentAccountServerPort = (account.index - 0) + basePort;
			QRCode.toDataURL('ss://' + base64.encode(shadowsocksSetting.method + ':' + account.password + '@47.88.160.69:' + currentAccountServerPort),function(err,url){

				const option = {
					from: 'June Chiu <june.chiu@163.com>',
					to: account.name,
					subject: '科学上网帐号信息',
					html: `Shadowsocks设置信息为：<br>
						加密方式：${shadowsocksSetting.method}<br>
						密码：${account.password}<br>
						服务器地址：47.88.160.69:${currentAccountServerPort}
						<p>或者扫描以下二维码，设置你的Shadowsocks客户端</p><img src="${url}">`
				};

				console.log('Sending mail to ' + option.to);

				nodemailerMailServer.sendMail(option, (err, response) => {

					if (err) {
						console.log(err);
					}
					else {
						callback();
					}

					console.log('Have sent to ' + option.to);

					// 重新生成shadowsocks配置文件
					shadowsocksSetting.port_password = Object.assign({}, shadowsocksSetting.port_password, allAccount);

					fs.writeFile('setting.json', JSON.stringify(shadowsocksSetting), (err) => {
						if (err) {
							throw err;
						}
						else {
							// 重启服务
							exec('ssserver -c setting.json -d restart', (error) => {
								if (error !== null) {
									console.log('exec error: ' + error);
								}
								else {
									// 成功重启服务
									console.log('Restart the service successfully');
								}
							});
						}
					});
				});
			});
		});
	};

	return output;
}
