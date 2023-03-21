import { IconProps } from '../components/Icon';

export const ICON_MAP: { [key: string]: { name: string; style: IconProps['style'] } } = {
	google: { name: 'google', style: 'line' },
	github: { name: 'github', style: 'line' },
	gitea: { name: 'git-repository-private', style: 'fill' }
};
