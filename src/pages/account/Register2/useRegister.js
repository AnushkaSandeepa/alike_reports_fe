import { authApi } from '@/common/api';
import { useAuthContext, useNotificationContext } from '@/common/context';

import * as yup from 'yup';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function useRegister() {
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuthContext();
  const { showNotification } = useNotificationContext();

  const schema = yup.object().shape({
    username: yup.string().required(t('Please enter name')),
    email: yup.string().email('Please enter valid email').required(t('Please enter email')),
    password1: yup
      .string()
      .required(t('Please enter password'))
      .min(8, 'Password is too short - should be 8 chars minimum')
      .matches(/[a-zA-Z]/, 'Password can only contain latin letters'),
    password2: yup.string().oneOf([yup.ref('password1')], 'Passwords must match'),
  });

  const register = async ({ data }) => {
    const { username, email, password1 } = data;
    setLoading(true);
    try {
      const res = await authApi.register({
        name: username,
        email,
        password: password1,
      });
      if (res?.data.id) {
        showNotification({
          message: 'Registration successful. Welcome aboard!',
          type: 'success',
        });
        navigate('/account/login');
      }
    } catch (e) {
      showNotification({ message: e.toString(), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return { loading, register, isAuthenticated, schema };
}
