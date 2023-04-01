import { Box, IconButton, Popper, Typography, useTheme } from '@mui/material';
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
		<>
			<IconButton onClick={onClick} disabled={disabled}>
				<Icon name='links' style='line' />
			</IconButton>
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
		</>
	);
}
