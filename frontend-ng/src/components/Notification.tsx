import { forwardRef } from 'react';
import { CustomContentProps, SnackbarContent } from 'notistack';
import { NotificationProps as MantineNotificationProps, Notification as MantineNotification } from '@mantine/core';
import { Check, Close, Warning } from './RemixIcon';

const Notification = forwardRef<HTMLDivElement, MantineNotificationProps & CustomContentProps>(
	({ id, ...props }, ref) => {
		return (
			<SnackbarContent ref={ref} style={{ minWidth: 200 }}>
				<MantineNotification {...props} sx={{ minWidth: 200 }} withCloseButton={false}>
					{props.message}
				</MantineNotification>
			</SnackbarContent>
		);
	}
);

export const ErrorNotification = forwardRef<HTMLDivElement, MantineNotificationProps & CustomContentProps>(
	({ id, ...props }, ref) => {
		return (
			<SnackbarContent ref={ref} style={{ minWidth: 200 }}>
				<MantineNotification
					{...props}
					sx={{ minWidth: 200 }}
					withCloseButton={false}
					color='red'
					icon={<Close />}>
					{props.message}
				</MantineNotification>
			</SnackbarContent>
		);
	}
);

export const SuccessNotification = forwardRef<HTMLDivElement, MantineNotificationProps & CustomContentProps>(
	({ id, ...props }, ref) => {
		return (
			<SnackbarContent ref={ref} style={{ minWidth: 200 }}>
				<MantineNotification
					{...props}
					sx={{ minWidth: 200 }}
					withCloseButton={false}
					color='green'
					icon={<Check />}>
					{props.message}
				</MantineNotification>
			</SnackbarContent>
		);
	}
);

export const WarnNotification = forwardRef<HTMLDivElement, MantineNotificationProps & CustomContentProps>(
	({ id, ...props }, ref) => {
		return (
			<SnackbarContent ref={ref} style={{ minWidth: 200 }}>
				<MantineNotification
					{...props}
					sx={{ minWidth: 200 }}
					withCloseButton={false}
					color='yellow'
					icon={<Warning />}>
					{props.message}
				</MantineNotification>
			</SnackbarContent>
		);
	}
);

Notification.displayName = 'Notification';

export default Notification;
