import type React from 'react';

export interface ButtonProps {
	variant?: 'primary' | 'secondary' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	onClick?: () => void;
	children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
	variant = 'primary',
	size = 'md',
	disabled = false,
	type = 'button',
	onClick,
	children,
}) => {
	const baseClasses =
		'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

	const variantClasses = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
		secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
		outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
	};

	const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

	const classes =
		`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses}`.trim();

	return (
		<button className={classes} onClick={onClick} disabled={disabled} type={type}>
			{children}
		</button>
	);
};

export default Button;
