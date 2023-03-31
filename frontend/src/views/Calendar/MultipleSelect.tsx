import {
	Checkbox,
	FormControl,
	InputLabel,
	ListItemText,
	MenuItem,
	OutlinedInput,
	Select,
	SelectChangeEvent
} from '@mui/material';
import React, { useState } from 'react';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: 250
		}
	}
};

export interface MultipleSelectProps {
	defaultValue: string[];
	options: string[];
	onChange: (selectedOptions: string[]) => void;
}

export default function MultipleSelect({ defaultValue, options, onChange }: MultipleSelectProps) {
	const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue);
	const handleChange = (event: SelectChangeEvent<typeof selectedValues>) => {
		const { value } = event.target;
		const newValue = typeof value === 'string' ? value.split(',') : value;
		setSelectedValues(newValue);
		onChange(newValue);
	};
	return (
		<FormControl sx={{ mt: 2 }}>
			<InputLabel id='multiple-checkbox-label'>zu kombinierende Stundepläne</InputLabel>
			<Select
				labelId='multiple-checkbox-label'
				id='multiple-checkbox'
				multiple
				value={selectedValues}
				onChange={handleChange}
				input={<OutlinedInput label='Tag' />}
				renderValue={selected => selected.join(', ')}
				MenuProps={MenuProps}>
				{options.map(option => (
					<MenuItem key={option} value={option}>
						<Checkbox checked={selectedValues.indexOf(option) > -1} />
						<ListItemText primary={option} />
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
