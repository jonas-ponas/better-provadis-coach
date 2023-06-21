import { Box, Button, IconButton, Popper, Typography, colors, useTheme } from '@mui/material';
import React, { useState } from 'react';
import Icon from '../../components/Icon';

export default function CopyButton({ textToCopy, disabled }: { textToCopy: string; disabled: boolean }) {
	const [showPopper, setShowPopper] = useState(false);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const theme = useTheme();

	const onClick = (event: React.MouseEvent<HTMLElement>) => {
		navigator.clipboard.writeText(textToCopy);
		setShowPopper(true);
		setAnchorEl(event.currentTarget);
		setTimeout(() => {
			setShowPopper(false);
			setAnchorEl(null);
		}, 2 * 1000);
	};

	return (
		<Box sx={{ mx: 1 }}>
			<Button
				size='small'
				onClick={onClick}
				disabled={disabled}
				startIcon={<Icon name='links' style='line' />}
				color='secondary'
				variant='outlined'>
				Copy Ical-Link
			</Button>
			<Popper open={showPopper} anchorEl={anchorEl}>
				<Box
					sx={{
						bgcolor: theme.palette.success.main,
						color: theme.palette.success.contrastText,
						p: theme.spacing(1),
						px: theme.spacing(2),
						borderRadius: theme.shape.borderRadius
					}}>
					<Typography variant='body2'>Kopiert!</Typography>
				</Box>
			</Popper>
		</Box>
	);
}
