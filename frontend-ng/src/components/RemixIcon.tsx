type styles = 'line' | 'fill';
type sizes =
	| 'fw'
	| 'xss'
	| 'xs'
	| 'sm'
	| '1x'
	| 'lg'
	| 'xl'
	| '2x'
	| '3x'
	| '4x'
	| '5x'
	| '6x'
	| '7x'
	| '8x'
	| '9x'
	| '10x';

export interface RemixIconProps extends Omit<React.HTMLProps<HTMLElement>, 'size'> {
	name: string;
	variant?: styles;
	size?: sizes;
}

export default function RemixIcon(props: RemixIconProps) {
	return (
		<i
			{...props}
			className={
				`ri-${props.name}` +
				(props.variant ? `-${props.variant}` : '-line') +
				(props.size ? ` ri-${props.size}` : '')
			}></i>
	);
}

function Icon(name: string) {
	return function Home5(props: Omit<RemixIconProps, 'name'>) {
		return <RemixIcon name={name} {...props} />;
	};
}

export const Home = Icon('home-5');
export const Folders = Icon('folders');
export const Calendar = Icon('calendar');
export const NewsPaper = Icon('newspaper');
export const Settings = Icon('settings-3');
export const LogoutBox = Icon('logout-box');
export const ArrowDropRight = Icon('arrow-drop-right');
export const ArrowDropLeft = Icon('arrow-drop-left');
export const Error = Icon('error-warning');
export const Close = Icon('close');
export const Check = Icon('check');
export const Warning = Icon('error-warning');
export const SwapBox = Icon('swap-box');
export const File = Icon('file');
export const Folder = Icon('folder');
export const ArrowUpCircle = Icon('arrow-up-circle');
