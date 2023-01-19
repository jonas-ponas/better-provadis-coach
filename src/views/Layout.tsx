import React, { useEffect, useState } from 'react';
import { Box, Grid, Link, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Brandbar from '../components/Brandbar';
import Navigation from '../components/Navigation';

import 'remixicon/fonts/remixicon.css';
import { getVersions } from '../util/getVersion';

export default function Layout(props: {}) {
	const theme = useTheme();
	const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));
	const [[uiVersion, pbVersion], setVersions] = useState<[string, string]>(['v?', 'v?']);

	useEffect(() => {
		getVersions().then(versions => {
			setVersions(versions);
		});
	}, []);

	const linkStyle = {
		color: theme.palette.grey[400],
		textDecorationColor: theme.palette.grey[400]
	};

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
									sx={linkStyle}
									href='https://github.com/jonas-ponas/expert-giggle-frontend/issues/new/choose'
									target='_blank'>
									Fehler melden / Feedback
								</Link>
								<Box sx={{}}>
									<Typography sx={{ ...linkStyle, display: 'inline-flex', gap: 1 }} variant='body2'>
										Version:
										<Link
											variant='body2'
											sx={linkStyle}
											href={`https://github.com/pocketbase/pocketbase/releases/tag/v${pbVersion}`}
											target='_blank'>
											{pbVersion}
										</Link>
										/
										<Link
											variant='body2'
											sx={linkStyle}
											href={`https://github.com/jonas-ponas/expert-giggle-frontend/releases/tag/v${uiVersion}`}
											target='_blank'>
											{uiVersion}
										</Link>
									</Typography>
								</Box>
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
