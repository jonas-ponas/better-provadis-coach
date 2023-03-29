import React from 'react';
import { Avatar, Box, Typography, useTheme } from '@mui/material';
import { usePocketbase } from '../util/PocketbaseContext';
import Searchbar from './Searchbar';

export default function Brandbar(props: {}) {
	const theme = useTheme();
	const client = usePocketbase();

	return (
		<Box
			sx={{
				bgcolor: theme.palette.primary.main,
				color: theme.palette.primary.contrastText,
				height: 50,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
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
					Better Provadis Coach
				</Typography>
			</Box>
			<Box>
				<Searchbar />
			</Box>
		</Box>
	);
}
