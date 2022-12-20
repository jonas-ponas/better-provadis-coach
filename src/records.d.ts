import { Record } from 'pocketbase';

export interface UserRecord extends Record {
	name: string;
	avatar: string | undefined;
	avatarUrl: string | undefined;
	favorites: string[];
	rootDirectory: string | undefined;
}

export interface FileRecord extends Record {
	name: string;
	size: number;
	timestamp: string;
	coachId: number;
	parent: string;
	cachedFile?: string;
	allowerUser: string[];
}

export interface DirectoryRecord extends Record {
	name: string;
	timestamp: string;
	parent: string | null;
	coachId: number;
	allowedUser: string[];
}

export interface StateRecord extends Record {
	token: string;
	refreshToken: string | undefined;
	user: string;
	expires: string;
	url: string;
	domainId: number | undefined;
	coachUserId: number | undefined;
	lastSync: string | undefined;
	coachUsername: string | undefined;
	lastFilesHash: string | undefined;
}
