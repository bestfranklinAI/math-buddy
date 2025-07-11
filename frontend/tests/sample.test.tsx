import { render } from '@testing-library/react';
import React from 'react';

describe('sample', () => {
  it('renders', () => {
    const { container } = render(<div>hello</div>);
    expect(container.textContent).toBe('hello');
  });
});
