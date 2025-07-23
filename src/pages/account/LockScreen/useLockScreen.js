import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

export default function useLockScreen() {
	const { t } = useTranslation();

	/*
	 * form validation schema
	 */
	const schema = yup.object().shape({
		password: yup.string().required(t('Please enter Password')),
	});

	/*
	 * handle form submission
	 */
	const onSubmit = ({ data }) => {
		const user= data;
		console.log(user);
	};

	return {
		schema,
		onSubmit,
	};
}
