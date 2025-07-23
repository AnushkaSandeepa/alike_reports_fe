import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const TOKEN =
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjb2RlcnRoZW1lcyIsImlhdCI6MTU4NzM1NjY0OSwiZXhwIjoxOTAyODg5NDQ5LCJhdWQiOiJjb2RlcnRoZW1lcy5jb20iLCJzdWIiOiJzdXBwb3J0QGNvZGVydGhlbWVzLmNvbSIsImxhc3ROYW1lIjoiVGVzdCIsIkVtYWlsIjoic3VwcG9ydEBjb2RlcnRoZW1lcy5jb20iLCJSb2xlIjoiQWRtaW4iLCJmaXJzdE5hbWUiOiJIeXBlciJ9.P27f7JNBF-vOaJFpkn-upfEh3zSprYfyhTOYhijykdI';

const mock = new MockAdapter(axios, { onNoMatch: 'passthrough' });

export default function configureFakeBackend() {
	const users = [
		{
			id: 1,
			email: 'hyper@coderthemes.com',
			username: 'Hyper',
			password: 'Hyper',
			firstName: 'Hyper',
			lastName: 'Coderthemes',
			role: 'Admin',
			token: TOKEN,
		},
	];

	mock.onPost('/login/').reply(function (config) {
		console.info("login")
		return new Promise(function (resolve, reject) {
			setTimeout(function () {
				// get parameters from post request
				let params = JSON.parse(config.data);

				// find if any user matches login credentials
				let filteredUsers = users.filter((user) => {
					return user.email === params.email && user.password === params.password;
				});

				if (filteredUsers.length) {
					// if login details are valid return user details and fake jwt token
					let user = filteredUsers[0];
					resolve([200, user]);
				} else {
					// else return error
					resolve([401, { message: 'Email or Password is incorrect' }]);
				}
			}, 1000);
		});
	});

	mock.onPost('/register/').reply(function (config) {
		return new Promise(function (resolve, reject) {
			setTimeout(function () {
				// get parameters from post request
				let params = JSON.parse(config.data);

				// add new users
				let [firstName, lastName] = params.fullname.split(' ');
				let newUser = {
					id: users.length + 1,
					username: firstName,
					password: params.password,
					firstName: firstName,
					lastName: lastName,
					role: 'Admin',
					token: TOKEN,
				};
				users.push(newUser);

				resolve([200, newUser]);
			}, 1000);
		});
	});

	mock.onPost('/forget-password/').reply(function (config) {
		return new Promise(function (resolve, reject) {
			setTimeout(function () {
				// get parameters from post request
				let params = JSON.parse(config.data);

				// find if any user matches login credentials
				let filteredUsers = users.filter((user) => {
					return user.email === params.email;
				});

				if (filteredUsers.length) {
					// if login details are valid return user details and fake jwt token
					let responseJson = {
						message:
							"We've sent you a link to reset password to your registered email.",
					};
					resolve([200, responseJson]);
				} else {
					// else return error
					resolve([
						401,
						{
							message:
								'Sorry, we could not find any registered user with entered email',
						},
					]);
				}
			}, 1000);
		});
	});
}
