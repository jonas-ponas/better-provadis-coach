import { Record } from 'pocketbase';

export interface UserRecord extends Record {
	name: string;
	avatar?: string;
	avatarUrl?: string;
	favorites: string[];
	rootDirectory?: string;
	autoSync: boolean;
}

export interface FileRecord extends Record {
	name: string;
	size: number;
	timestamp: string;
	coachId: number;
	parent: string;
	cachedFile?: string;
	allowedUser: string[];
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
	refreshToken?: string;
	user: string;
	expires: string;
	url: string;
	domainId?: number;
	coachUserId?: number;
	lastSync?: string;
	lastSyncSuccessful: boolean;
	coachUsername?: string;
	lastFilesHash?: string;
	lastSyncSuccessful: boolean;
}

export interface NewsItemRecord extends Record {
	coachId: number;
	title?: string;
	text?: string;
	author?: string;
	dateCreated?: string;
	allowedUsers: string[];
}
