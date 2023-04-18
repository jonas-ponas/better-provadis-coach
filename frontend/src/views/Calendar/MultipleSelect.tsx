import {
	Checkbox,
	FormControl,
	FormHelperText,
	InputLabel,
	ListItemText,
	MenuItem,
	Select,
	SelectChangeEvent,
	SxProps,
	Typography
} from '@mui/material';
import React, { useState } from 'react';

// const ITEM_HEIGHT = 48;
// const ITEM_PADDING_TOP = 8;
// const MenuProps = {
// 	PaperProps: {
// 		style: {
// 			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
// 			width: 250
// 		}
// 	}
// };

export interface MultipleSelectProps {
	defaultValue: string[];
	options: string[];
	onChange: (selectedOptions: string[]) => void;
	help?: string;
	sx?: SxProps;
}

export default function MultipleSelect({ defaultValue, options, onChange, help, sx }: MultipleSelectProps) {
	const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue);
	const handleChange = (event: SelectChangeEvent<typeof selectedValues>) => {
		const { value } = event.target;
		const newValue = typeof value === 'string' ? value.split(',') : value;
		setSelectedValues(newValue);
		onChange(newValue);
	};
	return (
		<FormControl fullWidth sx={sx}>
			<InputLabel id='multiple-checkbox-label'>verfügbare Stundenpläne</InputLabel>
			<Select
				labelId='multiple-checkbox-label'
				id='multiple-checkbox'
				multiple
				value={selectedValues}
				onChange={handleChange}
				label='verfügbare Stundenpläne'
				renderValue={selected => <Typography variant='body2'>{selected.join(', ')}</Typography>}>
				{options.map(option => (
					<MenuItem key={option} value={option}>
						<Checkbox checked={selectedValues.indexOf(option) > -1} />
						<ListItemText primary={option} />
					</MenuItem>
				))}
			</Select>
			{help && <FormHelperText>{help}</FormHelperText>}
		</FormControl>
	);
}
