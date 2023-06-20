export interface Record {
	id: string;
	created: string;
	updated: string;
	collectionId: string;
	collectionName: string;
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

export interface StateRecord extends Record {
	user: string;
	refreshToken?: string;
	token: string;
	/** @type UTC Date */
	expires: string;
	/** @types URl */
	url?: string;
	domainId?: number;
	coachUserId?: number;
	/** @type UTC Date */
	lastSync?: string;
	coachUsername?: string;
	lastSyncSuccessful: boolean;
	lastFilesHash?: string;
	lastNewsHash?: string;
}
