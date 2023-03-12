import { FormControl, InputLabel, MenuItem, Select as MuiSelect, SelectChangeEvent } from '@mui/material';
import React from 'react';

export default function Select({
	items,
	onChange,
	label,
	value
}: {
	items: { title: string; value: any }[];
	onChange: (newItem: any) => void;
	label: string;
	value: any;
}) {
	return (
		<FormControl fullWidth>
			<InputLabel id={`selectLabel-${label}`}>{label}</InputLabel>
			<MuiSelect
				labelId={`selectLabel-${label}`}
				id={`select-${label}`}
				value={value}
				label={label}
				onChange={(event: SelectChangeEvent<HTMLSelectElement>, child) => onChange(event.target.value)}>
				{items.map(({ title, value }) => (
					<MenuItem value={value} key={title}>
						{title}
					</MenuItem>
				))}
			</MuiSelect>
		</FormControl>
	);
}
