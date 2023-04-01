import { IconButton, InputBase, Paper, TextField, useTheme } from '@mui/material';
import React, { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';

export default function Searchbar(props: {}) {
	const theme = useTheme();
	const inputRef = useRef<null | HTMLInputElement>(null);
	const navigate = useNavigate();
	const [params, setParams] = useSearchParams();

	function onSubmit(event: React.FormEvent<HTMLFormElement> | React.MouseEvent) {
		event.preventDefault();
		if (!inputRef.current) return;
		navigate(`/search?q=${encodeURIComponent(inputRef.current.value)}`);
	}

	return (
		<Paper
			component='form'
			sx={{
				p: '2px 8px',
				display: 'flex',
				alignItems: 'center',
				height: 35
			}}
			onSubmit={onSubmit}>
			<InputBase
				inputRef={inputRef}
				size='small'
				placeholder='Suche..'
				margin='none'
				defaultValue={params.get('q') || ''}
				sx={{ '&> input': { p: 0 } }}
			/>
			<IconButton type='submit' aria-label='search' onClick={onSubmit}>
				<Icon name='search-2' style='line' />
			</IconButton>
		</Paper>
	);
}
