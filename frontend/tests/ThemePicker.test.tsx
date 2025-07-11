import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { ThemePicker } from '../src/components/ThemePicker';

test('select callback fires', () => {
  const cb = jest.fn();
  const { getByText } = render(
    <ThemePicker selected="Space Pirates" onSelect={cb} />,
  );
  fireEvent.click(getByText('Robot Helpers'));
  expect(cb).toHaveBeenCalledWith('Robot Helpers');
});
