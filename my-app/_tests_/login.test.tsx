import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TextInput, Button, View } from 'react-native';

function LoginMock() {
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleLogin = () => {
    if (email === 'test@flexshift.app') {
      setMessage('Đăng nhập thành công');
    } else {
      setMessage('Sai tài khoản');
    }
  };

  return (
    <View>
      <TextInput
        testID="email-input"
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
      />
      <Button title="Đăng nhập" onPress={handleLogin} />
      <Text testID="result">{message}</Text>
    </View>
  );
}

test('login success', () => {
  const { getByTestId, getByText } = render(<LoginMock />);

  fireEvent.changeText(getByTestId('email-input'), 'test@flexshift.app');
  fireEvent.press(getByText('Đăng nhập'));
  expect(getByTestId('result').props.children).toBe('Đăng nhập thành công');
});