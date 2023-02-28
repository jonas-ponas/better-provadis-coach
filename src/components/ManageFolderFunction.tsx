import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DirectoryRecord } from '../records';
import Icon from './Icon';

export default function ManageFolderFunction({
	directory,
	name,
	onReset
}: {
	directory?: DirectoryRecord;
	name: string;
	onReset: () => void;
}) {
	const navigate = useNavigate();
	return (
		<Stack
			direction='row'
			spacing={3}
			sx={{
				alignItems: 'center'
			}}>
			<Typography variant='body2'>{name}:</Typography>
			{directory !== undefined ? (
				<Chip
					label={directory.name}
					variant='filled'
					color='primary'
					size='small'
					deleteIcon={
						<Box sx={{ width: '1.5em' }}>
							<Icon name='external-link' style='line' />
						</Box>
					}
					onDelete={() => navigate(`/dir/${directory.id}`)}
				/>
			) : (
				<Typography variant='body2' sx={{ fontStyle: 'italic' }}>
					nicht festgelegt
				</Typography>
			)}

			<Button
				variant='outlined'
				size='small'
				color='error'
				disabled={directory === undefined}
				onClick={() => {
					onReset();
				}}
				startIcon={<Icon size='xss' name='delete-bin' style='line' />}
				sx={{
					height: 32
				}}>
				Zurücksetzen
			</Button>
		</Stack>
	);
}
