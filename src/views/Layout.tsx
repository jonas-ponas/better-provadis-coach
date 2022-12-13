import { Avatar, Box, Grid, Link, Typography, useTheme } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';

import 'remixicon/fonts/remixicon.css'
import Brandbar from '../components/Brandbar';
import Icon from '../components/Icon';
import Navigation from '../components/Navigation';

export default function Layout(props: {}) {
	const theme = useTheme();

    const contentHeight = `calc(100vh - 55px - ${theme.spacing(0.5)})` // FIXME
    const contentWidth = `calc(100vw - ${theme.spacing(2)} - ${theme.spacing(2)})`
	return (
		<Box sx={{
            bgcolor: theme.palette.grey[50],
            height: '100vh',
            width: '100vw',
            maxHeight: '100%',
            maxWidth: '100%',
            // overflowX: 'hidden',

            // width: '100vw'
        }}>
			<Brandbar />
			<Grid container sx={{
                maxHeight: '100%',
                maxWidth: '100%',
                width: '100vw',
                p: theme.spacing(2),
                ml: 0
            }} columnSpacing={2}>
                <Grid item lg={2} md={3} sm={1}>
                    <Navigation />
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mt: theme.spacing(1)
                    }}>
                        <Link variant='body2' sx={{
                            color: theme.palette.grey[400],
                            textDecorationColor: theme.palette.grey[400]
                        }} href='https://github.com/jonas-ponas/expert-giggle-frontend/issues/new/choose' target='_blank'>
                        Fehler melden / Feedback
                        </Link>
                    </Box>
                </Grid>
                <Grid item lg={10} md={9} sm={11} sx={{
                    height: `calc(100vh - (2 * ${theme.spacing(2)}) - 55px)`,
                    overflowY: 'auto'
                }}>
                <Outlet />
                </Grid>
            </Grid>
		</Box>
	);
}
