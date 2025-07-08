import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
	it('renders with default props', () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole('button', { name: 'Click me' });
		expect(button).toBeInTheDocument();
	});

	it('applies the correct variant class', () => {
		render(<Button variant="secondary">Secondary</Button>);
		const button = screen.getByRole('button');
		expect(button).toHaveClass('bg-gray-600');
	});

	it('applies the correct size class', () => {
		render(<Button size="lg">Large</Button>);
		const button = screen.getByRole('button');
		expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
	});

	it('handles disabled state', () => {
		render(<Button disabled>Disabled</Button>);
		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
	});

	it('calls onClick when clicked', () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);
		const button = screen.getByRole('button');
		button.click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});
});
