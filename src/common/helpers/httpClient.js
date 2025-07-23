import axios from 'axios';

const ErrorCodeMessages= {
	401: 'Invalid credentials',
	403: 'Access Forbidden',
	404: 'Resource or page not found',
};

function HttpClient() {
	const _errorHandler = (error) =>
		Promise.reject(
			Object.keys(ErrorCodeMessages).includes(error?.response?.status)
				? ErrorCodeMessages[error.response.status]
				: error.response.data && error.response.data.message
				? error.response.data.message
				: error.message || error
		);

	const _httpClient = axios.create({
		baseURL: process.env.VITE_API_URL,
		timeout: 6000,
		headers: {
			'Content-Type': 'application/json',
		},
	});

	_httpClient.interceptors.response.use((response) => {
		return response.data;
	}, _errorHandler);

	return {
		get: (url, config = {}) => _httpClient.get(url, config),
		post: (url, data, config = {}) => axios.post(url, data, config),
		patch: (url, config = {}) => _httpClient.patch(url, config),
		put: (url, config = {}) => _httpClient.put(url, config),
		delete: (url, config = {}) => _httpClient.delete(url, config),
		client: _httpClient,
	};
}

export default HttpClient();
