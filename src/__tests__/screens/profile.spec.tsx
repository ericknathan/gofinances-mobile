import React from 'react';
import { render } from '@testing-library/react-native';

import { Profile } from '../../screens/Profile';

describe('Screen: Profile', () => {
  it('should have correctly placeholder in username input', () => {
    const { getByPlaceholderText } = render(<Profile />);
  
    const inputName = getByPlaceholderText('Nome');
  
    // Deve existir
    expect(inputName).toBeTruthy();
  });
  
  it('should be load user data', () => {
    const { getByTestId } = render(<Profile />);
  
    const inputName = getByTestId('input-name');
    const inputSurname = getByTestId('input-surname');
  
    // Deve ser igual
    expect(inputName.props.value).toEqual('Erick');
    expect(inputSurname.props.value).toEqual('Nathan');
  });
  
  it('should exists correctly title', () => {
    const { getByTestId } = render(<Profile />);
  
    const textTitle = getByTestId('text-title');
  
    // Deve conter
    expect(textTitle.props.children).toContain('Perfil');
  });
})