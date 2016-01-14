const fs = require('fs');
const md5 = require('md5');
const QRCode = require('qrcode');
const exec = require('child_process').exec;
const sys = require('sys');

// 发送邮箱功能
const nodemailer = require('nodemailer'),
	mg = require('nodemailer-mailgun-transport');

const shadowsocksSetting = require('./shadowsocks-setting.json');

const express = require('express');
const bodyParser = require("body-parser");
const Firebase = require("firebase");


// 设置邮件收发服务
const nodemailerMailgun = nodemailer.createTransport(mg({
	auth: {
		api_key: 'key-e497ebd7414dcc5fe16b321a9894de5f',
		domain: 'sandbox159a9aa753254d559333a26496830e59.mailgun.org'
	}
}));

// Get a database reference to our posts
const ref = new Firebase("https://flickering-torch-8358.firebaseio.com/");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('resouce'));

app.get('/', function(req, res) {
	res.render('index');
});


app.get('/api/get/user', function (req, res) {
	ref.child('userList').once("value", function(snapshot) {
		res.send(snapshot.val());
	});
});

const sendActiveMail = (address, key, callback) => {
	const option = {
		from: 'June Chiu <june.chiu.s@gmail.com>', // sender address
		to: address, // list of receivers
		subject: '有料到 - 科学上网', // Subject line
		html: `<a href="http://ninja.junechiu.com/user/active/${key}">点击传送门，激活你的帐号</a>` // html body
	};

	nodemailerMailgun.sendMail(option, callback);
};

const sendSettingMail = (account, callback) => {

	// 先查出所有已经激活的用户
	console.log('开始查询所有用户');
	ref.child('user').orderByChild('active').equalTo(true).once("value", function(snapshot) {
		console.log('完成查询所有用户');
		const users = snapshot.val();

		const allAccount = {}, basePort = 30000;

		Object.keys(users).forEach(item => {
			allAccount[(users[item].index - 0) + basePort] = users[item].password;
		});

		QRCode.toDataURL('ss://' + shadowsocksSetting.method + ':' + account.password + '@47.88.160.69:' + ((account.index - 0) + basePort),function(err,url){

			const option = {
				from: 'June Chiu <june.chiu.s@gmail.com>', // sender address
				to: account.name, // list of receivers
				subject: '有料到 - 科学上网', // Subject line
				html: `<p>扫描二维码，设置你的Shadowsocks客户端</p><img src="${url}">` // html body
			};

			console.log('开始发送邮件');
			nodemailerMailgun.sendMail(option, () => {

				shadowsocksSetting.port_password = Object.assign({}, shadowsocksSetting.port_password, allAccount);

				fs.writeFile('setting.json', JSON.stringify(shadowsocksSetting), function (err) {
					if (err) throw err;
				});


				// 重启服务
				exec('ssserver –c setting.json -d start', function (error, stdout, stderr) {
					if (error !== null) {
						console.log('exec error: ' + error);
					}
					else {
						// 成功重启服务
						console.log('成功重启');
					}
				});

				console.log('完成发送邮件');

				callback();
			});
		});
	});
};

app.post('/api/post/signup', function (req, res) {

	const userCollection = ref.child('user').child(md5(req.body.account));

	userCollection.once('value',  snapshot => {
		const account = snapshot.val();
		if (account) {
			if (account.active) {
				// 跳转到二维码页面

				sendSettingMail(account, () => {
					res.send({
						code: 0,
						active: account.active,
						msg: '帐号信息已经发送到 - ' + account.name
					});
				});
			}
			else {
				// 发送激活连接到邮箱
				sendActiveMail(account.name, account.password, (err, response) => {
					if (err) {
						console.log(err);
					} else {
						res.send({
							code: 0,
							active: account.active,
							msg: '激活邮件已经发送到 - ' + account.name
						});
					}
				});
			}

		}
		else {
			const password = md5(req.body.account + Date.now());

			userCollection.set({
				name: req.body.account,
				password: password,
				active: false,
				index: -1
			}, function(){

				// 发送激活连接到邮箱
				sendActiveMail(req.body.account, password, (err, response) => {
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

app.get('/user/active/:id', function (req, res) {

	ref.child('user').orderByChild('password').equalTo(req.params.id).once('value',  snapshot => {
		const value = snapshot.val() || {};
		const key = Object.keys(value)[0];
		const account = value[key];
		if (account && !account.active) {
			// 激活成功
			ref.child('count').transaction(function (current_value) {
				snapshot.ref().child(key).update({
					active: true,
					password: md5(req.params.id + key),
					index: current_value
				}, () => {
				});

				return (current_value || 0) + 1;
			});

			res.render('index', {action: 'active-success'});
		}
		else {
			res.render('index', {action: 'active-fail'});
		}

	});


});





app.listen(80, 'ninja.junechiu.com', function () {
	console.log('Example app listening on port 3000!');
});
