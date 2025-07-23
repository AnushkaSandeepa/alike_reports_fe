import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { useState } from 'react';
import { useNotificationContext } from '@/common/context';

import { authApi } from '@/common';

export default function useRecoverPassword() {
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotificationContext();

  const { t } = useTranslation();

  /*
   * form schema
   */
  const schema = yup.object().shape({
    username: yup.string().required(t('Please enter Username')),
  });

  /*
   * handle form submission
   */
  const onSubmit = async ({ data }) => {
    const { email } = data;
    setLoading(true);
    try {
      const response = await authApi.forgetPassword(email);
      console.log(response);
    } catch (error) {
      showNotification({ message: error.toString(), type: 'error' });
    } finally {
      setLoading(false);
    }
    // dispatch(forgotPassword(formData["username"]));
  };

  return { loading, schema, onSubmit };
}
