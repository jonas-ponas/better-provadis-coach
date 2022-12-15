import React from 'react';
import { Box, Grid, Link, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Brandbar from '../components/Brandbar';
import Navigation from '../components/Navigation';

import 'remixicon/fonts/remixicon.css';

export default function Layout(props: {}) {
	const theme = useTheme();
	const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));

	return (
		<Box
			sx={{
				bgcolor: theme.palette.grey[50],
				height: '100vh',
				width: '100vw',
				maxHeight: '100%',
				maxWidth: '100%'
			}}>
			<Brandbar />
			<Grid
				container
				sx={{
					maxHeight: '100%',
					maxWidth: '100%',
					width: '100vw',
					p: theme.spacing(2),
					ml: 0
				}}
				columnSpacing={2}>
				<Grid item lg={2} md={3} sm={12} xs={12}>
					<Navigation iconsOnly={isSmallDevice} />
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							mt: theme.spacing(1)
						}}>
						{!isSmallDevice && (
							<Link
								variant='body2'
								sx={{
									color: theme.palette.grey[400],
									textDecorationColor: theme.palette.grey[400]
								}}
								href='https://github.com/jonas-ponas/expert-giggle-frontend/issues/new/choose'
								target='_blank'>
								Fehler melden / Feedback
							</Link>
						)}
					</Box>
				</Grid>
				<Grid
					item
					lg={10}
					md={9}
					sm={12}
					xs={12}
					sx={{
						height: `calc(100vh - (2 * ${theme.spacing(2)}) - 55px)`,
						overflowY: 'auto'
					}}>
					<Outlet />
				</Grid>
			</Grid>
		</Box>
	);
}
