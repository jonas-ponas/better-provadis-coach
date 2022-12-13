import { Avatar, Box, Typography, useTheme } from '@mui/material';
import React from 'react';
import { usePocketbase } from '../util/PocketbaseContext';

export default function Brandbar(props: {}) {
    const theme = useTheme()
	const client = usePocketbase()

	return (
		<Box
			sx={{
				bgcolor: theme.palette.primary.main,
				color: theme.palette.primary.contrastText,
				// width: `calc(100vw - ${theme.spacing(2)} - ${theme.spacing(2)} - ${theme.spacing(1)})`,
				height: 50,
				display: 'flex',
				pl: theme.spacing(2),
				pr: theme.spacing(2),
				boxShadow: theme.shadows[5]
			}}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center'
				}}>
				<Avatar
					src='/provadis-logo.png'
					sx={{
						bgcolor: theme.palette.common.white,
						height: 30,
						width: 30
					}}
				/>
				<Typography variant='h6' sx={{ fontWeight: 'bold', ml: theme.spacing(1) }}>
					Expert Giggle
				</Typography>
			</Box>
		</Box>
	);
}
