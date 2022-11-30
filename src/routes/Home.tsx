import {Container, useTheme, Typography, Button, Box, Avatar} from '@mui/material';
import React, {useContext, useEffect, useState} from 'react';
import PocketBaseContext from '../hooks/PocketbaseContext';
import {Record} from 'pocketbase';
import DirectoryTable from '../components/DirectoryTable';
import FolderTwoToneIcon from '@mui/icons-material/FolderTwoTone';
import PathBreadcrumb from '../components/PathBreadcrump';
import SyncDialog from '../components/SyncDialog';

export default function Home(props: {}) {
	const theme = useTheme();
	const client = useContext(PocketBaseContext);

	const [root, setRoot] = useState<Record | undefined>(undefined);
    const [showSyncDialog, setShowSyncDialog] = useState(false)

	useEffect(() => {
		// Get dir from url query
		const root = new URL(window.location.href).searchParams.get('dir');
        const expand = 'parent,parent.parent,parent.parent.parent,parent.parent.parent.parent,parent.parent.parent.parent.parent,parent.parent.parent.parent.parent.parent'
		if (!root) {
			client?.collection('directory')
				.getFirstListItem('parent = null', {
					expand
				})
				.then(record => {
					setRoot(record);
				});
			return;
		} 
		client?.collection('directory')
			.getOne(root, {
				expand
			})
			.then(record => {
				setRoot(record);
			});
		
	}, []);

	function logout() {
		client?.authStore.clear();
		window.location.href = '/login';
	}

	return (
		<Box
			sx={{
				width: '100vw',
				height: '100vh',
				bgcolor: theme.palette.grey[50],
				display: 'flex',
				justifyContent: 'center'
			}}
		>
			<Container
				sx={{
					bgcolor: theme.palette.grey[50]
				}}
			>
				<Box
					sx={{
						mt: theme.spacing(4),
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center'
					}}
				>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center'
						}}
					>
						<Avatar src='/provadis-logo.png'  sx={{
                            bgcolor: theme.palette.common.white,
                            // height: 24,
                            // width: 24
                        }}/>
						<Typography
							variant='h5'
							sx={{
								fontWeight: 'bold',
                                ml: theme.spacing(1)
							}}
						>
							Expert Giggle
						</Typography>
					</Box>
				</Box>
				<Box
					sx={{
						mt: theme.spacing(1),
                        display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center'
					}}
				>
					<PathBreadcrumb directory={root} />
					<span>
						<Button
							variant='outlined'
							size='small'
                            onClick={() => setShowSyncDialog(true)}
							sx={{
								mr: theme.spacing(2)
							}}
						>
							Sync now
						</Button>
						<Button onClick={logout} variant='contained' size='small' LinkComponent='a' href='#'>
							Logout
						</Button>
					</span>
				</Box>
				<Box
					sx={{
						mt: theme.spacing(2)
					}}
				>
					{root ? <DirectoryTable record={root} /> : 'Lade Daten ...'}
				</Box>
			</Container>
            <SyncDialog open={showSyncDialog} onFinished={() => setShowSyncDialog(false)}/>
		</Box>
	);
}
