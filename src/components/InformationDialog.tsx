import { useTheme, Dialog, DialogTitle, DialogContent, DialogContentText, Link } from '@mui/material';
import React from 'react';

export default function InformationDialog({ open, onClose }: { open: boolean, onClose: ()=>void}) {
	const theme = useTheme();

	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>Information</DialogTitle>
			<DialogContent>
				<DialogContentText>
					Icons:
					<ul>
						<li>
							File Icons from{' '}
							<Link href='https://github.com/PKief/vscode-material-icon-theme/'>
								vscode-material-icon-theme
							</Link>
						</li>
						<li>
							<Link href='https://fonts.google.com/icons'>Material Icons</Link>
						</li>
					</ul>
					Technologies:
					<ul>
						<li>
							<Link href='https://reactrouter.com/'>React Router</Link>
						</li>
                        <li>
                            <Link href="https://mui.com/">Material UI</Link>
                        </li>
                        <li>
                            <Link href="https://github.com/cozmo/jsQR">jsQR</Link>
                        </li>
					</ul>
				</DialogContentText>
			</DialogContent>
		</Dialog>
	);
}
