import React, { useEffect, useState } from 'react';
import { Box, Grid, Link, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Brandbar from './Brandbar';
import Navigation from './Navigation';
import 'remixicon/fonts/remixicon.css';

export default function Layout(props: {}) {
	const theme = useTheme();
	const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));

	const uiVersion = import.meta.env.VITE_UI_VERSION || '???';
	const pbVersion = import.meta.env.VITE_PB_VERSION || '???';

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
							<>
								<Link
									variant='body2'
									sx={{
										color: theme.palette.grey[400],
										textDecorationColor: theme.palette.grey[400]
									}}
									href='https://github.com/jonas-ponas/better-provadis-coach/issues/new/choose'
									target='_blank'>
									Fehler melden / Feedback
								</Link>
								<Typography
									sx={{
										color: theme.palette.grey[400],
										textDecorationColor: theme.palette.grey[400]
									}}
									variant='body2'>
									Version: {uiVersion} / {pbVersion}
								</Typography>
							</>
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
