import { forwardRef, useImperativeHandle, useState } from 'react';
import { SystemMessagesResponse } from '../pocketbase-types';
import { Modal, Text, Title } from '@mantine/core';

export type AnnouncementProps = { announcement: SystemMessagesResponse | undefined; onClose: VoidFunction };

export type AnnouncementRef = { open: VoidFunction; close: VoidFunction } | null;

const Announcement = forwardRef<AnnouncementRef, AnnouncementProps>(({ announcement, onClose }, ref) => {
	const [opened, setOpened] = useState(false);

	useImperativeHandle(
		ref,
		() => ({
			open: () => {
				setOpened(true);
			},
			close: () => {
				setOpened(false);
			}
		}),
		[]
	);

	return (
		<Modal
			opened={opened}
			onClose={() => {
				setOpened(false);
				onClose();
			}}
			title={<Title size='h3'>{announcement?.title}</Title>}>
			<Text dangerouslySetInnerHTML={{ __html: announcement?.text ?? '' }}></Text>
		</Modal>
	);
});

export default Announcement;
